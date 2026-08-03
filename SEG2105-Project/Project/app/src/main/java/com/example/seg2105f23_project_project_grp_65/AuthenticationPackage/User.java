package com.example.seg2105f23_project_project_grp_65.AuthenticationPackage;

//Save for later
enum userType {
    participant,
    admin,
    cyclingClub,

}

public class User {
    private String username;
    private String password;
    private Role role; // Using enum instead of String for role


    public User(String username, String password, Role role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}

