package com.example.seg2105f23_project_project_grp_65.AuthenticationPackage;

import java.util.*;
public class AuthenticationManager {
    private List<User> registeredUsers = new ArrayList<>();

    public AuthenticationManager() {
        // Adding a default admin user
        registeredUsers.add(new User("admin", "admin", Role.ADMIN));
    }

    public boolean registerUser(String username, String password, Role role) {
        for (User user : registeredUsers) {//**There might be better algorithm
            if (user.getUsername().equalsIgnoreCase(username)) {
                return false; //User already exists
            }
        }

        registeredUsers.add(new User(username, password, role));
        return true;
    }

    public User authenticateUser(String username, String password) {
        for (User user : registeredUsers) {//**There might be better algorithm
            if (user.getUsername().equalsIgnoreCase(username) && user.getPassword().equals(password)) {
                return user; //Successful authentication
            }
        }

        return null; //Authentication failed
    }
}

