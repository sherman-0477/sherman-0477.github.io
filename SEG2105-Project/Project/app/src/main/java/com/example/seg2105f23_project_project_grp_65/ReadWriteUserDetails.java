package com.example.seg2105f23_project_project_grp_65;
//This is for firestore
//- Sherman

public class ReadWriteUserDetails {
    public String fullName, phoneNumber, socialLink;

    public  ReadWriteUserDetails(String textFullName, String textPhoneNumber, String textSocialLink){
        this.fullName = textFullName;
        this.phoneNumber = textPhoneNumber;
        this.socialLink = textSocialLink;
    }
}
