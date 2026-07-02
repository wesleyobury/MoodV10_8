package expo.modules.moodhealthkit

import android.content.Context
import android.content.Intent
import androidx.health.connect.client.PermissionController
import expo.modules.kotlin.activityresult.AppContextActivityResultContract

/**
 * Adapts Health Connect's permission request contract to Expo's
 * AppContextActivityResultContract so it can be launched via
 * `registerForActivityResult` from the module.
 *
 * Input  = the set of Health Connect permission strings to request
 *          (as an ArrayList so it is Serializable, per Expo's contract).
 * Output = the set of permission strings the user actually granted.
 */
class HealthConnectPermissionContract :
  AppContextActivityResultContract<ArrayList<String>, Set<String>> {

  private val delegate = PermissionController.createRequestPermissionResultContract()

  override fun createIntent(context: Context, input: ArrayList<String>): Intent =
    delegate.createIntent(context, input.toSet())

  override fun parseResult(input: ArrayList<String>, resultCode: Int, intent: Intent?): Set<String> =
    delegate.parseResult(resultCode, intent)
}
