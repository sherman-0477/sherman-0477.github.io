package com.example.seg2105f23_project_project_grp_65.ParticipantPackage;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

import com.example.seg2105f23_project_project_grp_65.MainActivity;
import com.example.seg2105f23_project_project_grp_65.R;

public class Participant extends AppCompatActivity {
    TextView participantNameUser; // Username Textview variable


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_participant);

        Intent intent = getIntent(); // Gets the intent send from ActibityMain
        String Username = intent.getStringExtra(MainActivity.TEXT);

        participantNameUser = findViewById(R.id.Name_User2);
        String message = "Welcome "+ Username+ "! You are logged in as an Participant."; //The message that the Textview shows
        participantNameUser.setText(message); // Set the message of textview

    }
}