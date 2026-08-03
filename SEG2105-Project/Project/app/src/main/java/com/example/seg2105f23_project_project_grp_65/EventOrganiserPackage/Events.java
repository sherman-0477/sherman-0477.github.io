package com.example.seg2105f23_project_project_grp_65.EventOrganiserPackage;

import java.util.Calendar;

public class Events {
    Calendar start; //starts and ends of dates so they are calendar
    Calendar end;
    Calendar date;
    String[] locations;
    Levels level;
    float fees;
    public void setStart(Calendar start) { //sets start day
        this.start = start;
    }
    public void setEnd(Calendar end){ //sets end day
        this.end = end;
    }
    public void setDate(Calendar date){
        this.date = date;
    }
    public void setLocations(String[] locations){ //sets the location
        this.locations = locations;
    }
    public void setLevel(Levels level){
        this.level = level;
    }
    public void setFees(float fees){
        this.fees = fees;
    }
    public Calendar getStart(){ //returns the start day
        return start;
    }
    public Calendar getEnd(){ //returns the end day
        return end;
    }
    public String[] getLocations(){ //returns the locations of the event
        return locations;
    }
    public Levels getLevel(){
        return level;
    }

    public Events(Calendar Eventstart, Calendar Eventend, Calendar Eventdate, String [] Eventlocation, Levels Eventlevel, float Eventfees){
        start = Eventstart;
        end = Eventend;
        date = Eventdate;
        locations = Eventlocation;
        level = Eventlevel;
        fees = Eventfees;


    }
}
