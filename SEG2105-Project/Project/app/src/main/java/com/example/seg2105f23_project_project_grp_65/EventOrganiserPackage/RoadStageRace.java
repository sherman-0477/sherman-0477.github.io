package com.example.seg2105f23_project_project_grp_65.EventOrganiserPackage;

import java.util.Calendar;

public class RoadStageRace extends Events {
    public RoadStageRace(Calendar start, Calendar end, Calendar date, String[] location, Levels level, float fees) {
        super(start, end, date, location, level, fees);
    }

    @Override
    public void setStart(Calendar start) {
        super.setStart(start);
    }
    @Override
    public void setEnd(Calendar end) {
        super.setEnd(end);
    }
    @Override
    public void setLocations(String[] locations) {
        super.setLocations(locations);
    }
    @Override
    public void setLevel(Levels level) {
        super.setLevel(level);
    }
    @Override
    public void setFees(float fees) {
        super.setFees(fees);
    }
}
