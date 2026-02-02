package com.chadharangam.notificationservice.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import com.chadharangam.notificationservice.dto.MoveEvent;

@Controller
public class NotificationController {

    @MessageMapping("/move")
    @SendTo("/topic/game")
    public MoveEvent broadcastMove(MoveEvent event) {
        return event;
    }
}
