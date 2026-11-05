package org.sheraksha.app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class HardwareTriggerReceiver extends BroadcastReceiver {
    private static final String TAG = "SheRakshaReceiver";
    private static int powerButtonTapCount = 0;
    private static long lastTapTime = 0;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_SCREEN_ON.equals(action) || Intent.ACTION_SCREEN_OFF.equals(action)) {
            long now = System.currentTimeMillis();
            if (now - lastTapTime < 2000) {
                powerButtonTapCount++;
            } else {
                powerButtonTapCount = 1;
            }
            lastTapTime = now;

            Log.d(TAG, "Hardware power trigger tap: " + powerButtonTapCount);
            if (powerButtonTapCount >= 4) {
                Log.w(TAG, "CRITICAL: 4-Tap hardware SOS trigger sequence verified!");
                powerButtonTapCount = 0;
            }
        }
    }
}
