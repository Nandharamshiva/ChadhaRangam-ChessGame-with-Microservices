package com.chadharangam.userservice.controller;

import com.chadharangam.userservice.dto.LoginRequest;
import com.chadharangam.userservice.security.JwtUtil;
import org.springframework.web.bind.annotation.*;
import com.chadharangam.userservice.dto.RegisterRequest;
import com.chadharangam.userservice.entity.User;
import com.chadharangam.userservice.service.UserService;

@RestController
@RequestMapping("/api/users")
public class AuthController {

    private final UserService service;

    public AuthController(UserService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest request) {
        User user = new User();
        user.setUsername(request.username);
        user.setEmail(request.email);
        user.setPassword(request.password);
        return service.register(user);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {

        User user = service.authenticate(
                request.username,
                request.password
        );

        return JwtUtil.generateToken(user.getUsername());
    }

}
