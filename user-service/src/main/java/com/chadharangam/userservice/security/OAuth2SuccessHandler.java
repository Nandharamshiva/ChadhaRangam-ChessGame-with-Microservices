package com.chadharangam.userservice.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.chadharangam.userservice.entity.User;
import com.chadharangam.userservice.repository.UserRepository;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final Pattern NON_USERNAME_CHARS = Pattern.compile("[^a-z0-9_]+");

    private final UserRepository userRepository;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public OAuth2SuccessHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) {
        try {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

            String provider = "OAUTH2";
            if (authentication instanceof OAuth2AuthenticationToken token) {
                provider = token.getAuthorizedClientRegistrationId();
            }
            String providerUpper = String.valueOf(provider).toUpperCase(Locale.ROOT);

            String providerId = firstNonBlank(
                    asString(oauth2User.getAttribute("sub")),
                    asString(oauth2User.getAttribute("id")),
                    oauth2User.getName()
            );

            String login = asString(oauth2User.getAttribute("login"));
            String email = asString(oauth2User.getAttribute("email"));
            if (email == null && "GITHUB".equals(providerUpper)) {
                String fallback = firstNonBlank(login, providerId, "user");
                email = fallback + "@users.noreply.github.com";
            }

            String displayName = firstNonBlank(
                    asString(oauth2User.getAttribute("name")),
                    login,
                    email != null ? email.split("@", 2)[0] : null,
                    "Player"
            );

            Optional<User> existing = Optional.empty();
            if (providerId != null) {
                existing = userRepository.findByProviderAndProviderId(providerUpper, providerId);
            }
            if (existing.isEmpty() && email != null) {
                existing = userRepository.findByEmail(email);
            }

            User user = existing.orElseGet(User::new);

            if (user.getId() == null) {
                user.setEmail(email);
                user.setProvider(providerUpper);
                user.setProviderId(providerId);

                String usernameBase = sanitizeUsername(firstNonBlank(login, displayName, "player"));
                String username = ensureUniqueUsername(usernameBase);
                user.setUsername(username);
            } else {
                // If a local account matches by email, link provider info.
                if (user.getProvider() == null || "LOCAL".equalsIgnoreCase(user.getProvider())) {
                    user.setProvider(providerUpper);
                    user.setProviderId(providerId);
                }
            }

            userRepository.save(user);

            String jwt = JwtUtil.generateToken(user.getUsername());
            String redirect = frontendBaseUrl + "/oauth2/callback?token="
                    + URLEncoder.encode(jwt, StandardCharsets.UTF_8);

            response.sendRedirect(redirect);
        } catch (IOException e) {
            throw new RuntimeException("OAuth2 redirect failed", e);
        } catch (Exception e) {
            try {
                response.sendRedirect(frontendBaseUrl + "/login?oauth2Error=1");
            } catch (IOException ignored) {
                // no-op
            }
        }
    }

    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int i = 0;
        while (userRepository.existsByUsername(candidate)) {
            i++;
            candidate = base + i;
        }
        return candidate;
    }

    private static String sanitizeUsername(String input) {
        String s = String.valueOf(input).trim().toLowerCase(Locale.ROOT);
        s = s.replace(' ', '_');
        s = NON_USERNAME_CHARS.matcher(s).replaceAll("");
        if (s.isBlank()) return "player";
        if (s.length() > 24) s = s.substring(0, 24);
        return s;
    }

    private static String asString(Object v) {
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }
}
