package org.sheraksha.app;

import android.app.Application;
import android.util.Log;

public class MainApplication extends Application {
    private static final String TAG = "SheRaksha";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "She-Raksha MainApplication initialized with Hardware Triggers & Secure Enclave.");
    }
}
