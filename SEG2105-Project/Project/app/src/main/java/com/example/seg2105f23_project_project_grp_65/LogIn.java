package com.example.seg2105f23_project_project_grp_65;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.example.seg2105f23_project_project_grp_65.AdminPackage.Administrator;
import com.example.seg2105f23_project_project_grp_65.EventOrganiserPackage.EventOrganiser;
import com.example.seg2105f23_project_project_grp_65.ParticipantPackage.Participant;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;

import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class LogIn extends AppCompatActivity {
    public static final String TEXT = "com.example.seg2105f23_project_project_grp_65.EXTRA_TEXT"; // Variable for the text
    Button Login; // Variable for the login button.

    Button toRegisterMenu;
    EditText UserNameInput2; // Variable for the User Name input
    EditText PasswordInput2; // Variable for the Password input
    FirebaseAuth auth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_log_in);

        Login = findViewById(R.id.BtnLogin);
        toRegisterMenu = findViewById(R.id.toRegisterMenuButton);
        UserNameInput2 = findViewById(R.id.LoginUsername); // Get the ID from the TextInput
        PasswordInput2 = findViewById(R.id.LoginPassword); // Get the ID from the IntInput
        auth = FirebaseAuth.getInstance();

        Intent intent = getIntent(); // Gets the intent send from ActivityMain
        String activity = intent.getStringExtra(LogIn.TEXT);

        Login.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String UserName, Password;
                UserName = UserNameInput2.getText().toString();
                Password = PasswordInput2.getText().toString();
                loginUser(UserName,Password, activity);
            }
        });

        toRegisterMenu.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent switchToLogin = new Intent(LogIn.this, MainActivity.class);
                startActivity(switchToLogin);
            }
        });

    }

    private void loginUser(String UserName, String Password, String activity) {
        if(TextUtils.isEmpty(UserName)){
            Toast.makeText(LogIn.this,"Please put a Username",Toast.LENGTH_SHORT).show();
            return;
        }
        else if(TextUtils.isEmpty(Password)){
            Toast.makeText(LogIn.this,"Please put a Password",Toast.LENGTH_SHORT).show();
            return;
        }

        //Check if user inputs a valid email format username
        String regex = "^[a-zA-Z0-9_]+[a-zA-Z0-9_.]*@[a-zA-Z0-9_-]+\\.[a-zA-Z0-9-.]+$";
        Pattern pattern = Pattern.compile(regex, Pattern.UNICODE_CASE);
        Matcher matcher = pattern.matcher(UserName);

        String definedRegisterUserName;

        //If so, continue to pass the registerUserName string
        if (matcher.matches()) {
            definedRegisterUserName=UserName;
        }
        //If not, create a dummy email suffix to login, since firebase only accept username with email format.
        else {
            definedRegisterUserName=UserName+"@firebase.com";
        }

        auth.signInWithEmailAndPassword(definedRegisterUserName, Password).addOnSuccessListener(new OnSuccessListener<AuthResult>() {
            @Override
            public void onSuccess(AuthResult authResult) {
                Toast.makeText(LogIn.this, "LogIn successful",Toast.LENGTH_SHORT).show();
                openUser(activity);
            }
        });

    }
    public void openUser(String activity){ // This is called by the oncreate
        String UserName;

        UserName = String.valueOf(UserNameInput2.getText());

        if(Objects.equals(activity, "admin")){ // If the radio Id of the

            Intent intent = new Intent(this, Administrator.class); // Open the Administrator activity
            intent.putExtra(TEXT, UserName); // Pass the username variable to the administrator class
            startActivity(intent);

        }
        else if(Objects.equals(activity, "eventOrganiser")){
            Intent intent = new Intent(this, EventOrganiser.class); // Open the Administrator activity
            intent.putExtra(TEXT, UserName); // Pass the username variable to the administrator class
            startActivity(intent);

        }
        else{
            Intent intent = new Intent(this, Participant.class); // Open the Administrator activity
            intent.putExtra(TEXT, UserName); // Pass the username variable to the administrator class
            startActivity(intent);
        }
    }


}