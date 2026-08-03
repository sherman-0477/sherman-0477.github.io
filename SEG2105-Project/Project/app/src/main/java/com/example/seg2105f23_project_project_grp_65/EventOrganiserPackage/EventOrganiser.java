package com.example.seg2105f23_project_project_grp_65.EventOrganiserPackage;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

import com.example.seg2105f23_project_project_grp_65.MainActivity;
import com.example.seg2105f23_project_project_grp_65.R;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.Calendar;

public class EventOrganiser extends AppCompatActivity {
    TextView eventOrganiserNameUser; // Username Textview variable


    DatabaseReference syncEvent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_event_organiser);

        Intent intent = getIntent(); // Gets the intent send from ActivityMain
        String Username = intent.getStringExtra(MainActivity.TEXT);

        eventOrganiserNameUser = findViewById(R.id.Name_User2);
        String message = "Welcome "+ Username+ "! You are logged in as an Event Organiser.";//The message that the Textview shows
        eventOrganiserNameUser.setText(message); // Set the message of textview

        FirebaseDatabase database = FirebaseDatabase.getInstance();
        syncEvent = database.getReference("events");
    }

    private void makeEvent(Calendar Eventstart, Calendar Eventend, Calendar Eventdate, String [] Eventlocation, Levels Eventlevel, float Eventfees){
        String eventId = syncEvent.push().getKey();

        Events events = new Events(Eventstart, Eventend, Eventdate, Eventlocation,  Eventlevel, Eventfees);

        syncEvent.child(eventId).setValue(events);
    }

}