package com.example.seg2105f23_project_project_grp_65.EventOrganiserPackage;

import java.util.Calendar;

public class GroupRides extends Events{
    public GroupRides(Calendar start, Calendar end, Calendar date, String[] location, Levels level, float fees) {
        super(start, end, date, location, level, fees);
    }

    @Override
    public void setDate(Calendar date) {
        super.setDate(date);
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
