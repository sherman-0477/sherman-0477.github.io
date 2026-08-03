package com.example.seg2105f23_project_project_grp_65;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.regex.Matcher;
import java.util.regex.Pattern;


public class MainActivity extends AppCompatActivity {
    public static final String TEXT = "com.example.seg2105f23_project_project_grp_65.EXTRA_TEXT"; // Variable for the text

    Button register; // Variable for the register button.
    TextView ToLogIN;
    Button LogInButton;
    EditText UserNameInput; // Variable for the User Name input
    EditText PasswordInput; // Variable for the Password input
    RadioGroup radioGroup ; // Variable for the RadioGroup
    RadioButton adminRadio; // Variable for the Admin radioButton
    RadioButton eventOrganiserRadio; // Variable for the Event organiser radioButton
    RadioButton participantRadio; // Variable for the Participant radioButton
    FirebaseAuth mAuth;

    // creating a variable for our
    // Firebase Database.
    FirebaseDatabase firebaseDatabase;

    // creating a variable for our Database
    // Reference for Firebase.
    DatabaseReference databaseReference;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mAuth = FirebaseAuth.getInstance();
        register = findViewById(R.id.BtnRegister);
        UserNameInput = findViewById(R.id.UsernameText); // Get the ID from the TextInput
        PasswordInput = findViewById(R.id.PasswordText); // Get the ID from the IntInput
        radioGroup = findViewById(R.id.RadioMain2); // Get the ID from the RadioGroup
        adminRadio = findViewById(R.id.radioAdmin);// Get the ID from the admin radio button
        eventOrganiserRadio = findViewById(R.id.radioEventManage);// Get the ID from the eventOrganiser Radio Button
        participantRadio =findViewById(R.id.radioParticipant);// Get the ID from the participant Radio Button

        LogInButton = findViewById(R.id.LoginButton);

        databaseReference = FirebaseDatabase.getInstance().getReferenceFromUrl("https://seg2105-project-db-default-rtdb.firebaseio.com/");

         register.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) { // Register button
                String UserName, Password;

                UserName = UserNameInput.getText().toString();
                Password = PasswordInput.getText().toString();

                if(TextUtils.isEmpty(UserName)){

                    Toast.makeText(MainActivity.this,"Please put a Username",Toast.LENGTH_SHORT).show();
                    return;
                }
                else if(TextUtils.isEmpty(Password)){
                    Toast.makeText(MainActivity.this,"Please put a Password",Toast.LENGTH_SHORT).show();
                    return;
                }
                else{
                    registerUser(UserName,Password);
                }
            }
        });
        LogInButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(MainActivity.this, LogIn.class);
                startActivity(intent);
            }
        });
    }

    private void registerUser(String registerUserName, String registerPassword) {

        //Check if user inputs a valid email format username
        String regex = "^[a-zA-Z0-9_]+[a-zA-Z0-9_.]*@[a-zA-Z0-9_-]+\\.[a-zA-Z0-9-.]+$";
        Pattern pattern = Pattern.compile(regex, Pattern.UNICODE_CASE);
        Matcher matcher = pattern.matcher(registerUserName);

        String definedRegisterUserName;
        //If so, continue to pass the registerUserName string
        if (matcher.matches()) {
            definedRegisterUserName=registerUserName;
        }
        //If not, create a dummy email suffix to register, since firebase only accept username with email format.
        else {
            definedRegisterUserName=registerUserName+"@firebase.com";
        }

        //Continue to register process
        mAuth.createUserWithEmailAndPassword(definedRegisterUserName, registerPassword).addOnCompleteListener(new OnCompleteListener<AuthResult>() {
            @Override
            public void onComplete(@NonNull Task<AuthResult> task) {
                if (task.isSuccessful()) {
                    Toast.makeText(MainActivity.this, "Account created",Toast.LENGTH_SHORT).show();
                    databaseReference.child("users").child(registerPassword).child("Username").setValue(definedRegisterUserName);
                    openActivity2(null);
                }
                else {
                    // If sign in fails, display a message to the user.
                    Toast.makeText(MainActivity.this, "Authentication failed.",
                            Toast.LENGTH_SHORT).show();
                }
            }
        });

    }
    // This is the right Project

    // This method is to open MainActivity2
    //  Is the OnCreate method for the register button

    public void openActivity2(View view2){ // This is called by the OnCreate
        String activity ="";

        int selectedRadioId = radioGroup.getCheckedRadioButtonId();

        if(findViewById(selectedRadioId) == adminRadio){ // If the radio Id of the
            activity = "admin";
            Intent intent = new Intent(this, LogIn.class); // Open the Administrator activity
            intent.putExtra(TEXT, activity); // Pass the username variable to the administrator class
            startActivity(intent);

        }
        else if(findViewById(selectedRadioId) == eventOrganiserRadio){
            activity = "eventOrganiser";
            Intent intent = new Intent(this, LogIn.class); // Open the Administrator activity
            intent.putExtra(TEXT, activity); // Pass the username variable to the administrator class
            startActivity(intent);

        }
        else{
            activity = "participant";
            Intent intent = new Intent(this, LogIn.class); // Open the Administrator activity
            intent.putExtra(TEXT, activity); // Pass the username variable to the administrator class
            startActivity(intent);
        }
    }
}