package com.offlinestore.inventory;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    public class AndroidPrintBridge {
        private final Context context;

        public AndroidPrintBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void printHtml(final String html) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    WebView printWebView = new WebView(context);
                    printWebView.getSettings().setJavaScriptEnabled(true);
                    printWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            PrintManager printManager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
                            if (printManager != null) {
                                PrintDocumentAdapter printAdapter = view.createPrintDocumentAdapter("Struk-Tari-Jaya");
                                printManager.print("Struk-Tari-Jaya", printAdapter, new PrintAttributes.Builder().build());
                            }
                        }
                    });
                    printWebView.loadDataWithBaseURL("https://localhost", html, "text/html", "UTF-8", null);
                }
            });
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().addJavascriptInterface(new AndroidPrintBridge(this), "AndroidPrint");
        }
    }
}
