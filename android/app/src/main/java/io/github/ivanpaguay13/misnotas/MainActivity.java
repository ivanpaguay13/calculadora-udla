package io.github.ivanpaguay13.misnotas;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import org.json.JSONException;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/web/index.html";
    private static final int IMPORT = 1;
    private static final int EXPORT = 2;
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingBackup;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        // Keep content and the keyboard clear of system bars, including Android 15.
        web.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(web);
        web.requestApplyInsets();
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (isLocal(request.getUrl())) {
                    WebResourceResponse response = loader.shouldInterceptRequest(request.getUrl());
                    if (response != null) return response;
                }
                // Never fetch remote pages or resources inside this local application.
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                    Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isLocal(request.getUrl());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT)
                    .addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
                    .putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                try { startActivityForResult(intent, IMPORT); }
                catch (ActivityNotFoundException error) {
                    fileCallback.onReceiveValue(null); fileCallback = null;
                    toast("No hay un selector de archivos disponible.");
                }
                return true;
            }
        });
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "AndroidBackup", Collections.singleton("https://" + HOST),
                (view, message, origin, mainFrame, reply) -> {
                    if (!mainFrame) return;
                    if (pendingBackup != null) { toast("Termina de guardar el respaldo anterior."); return; }
                    try {
                        JSONObject data = new JSONObject(message.getData());
                        String text = data.getString("text");
                        String name = data.getString("name");
                        if (text.length() > 2_000_000 || !name.matches("[a-zA-Z0-9._-]+\\.json")) {
                            toast("El respaldo no es válido."); return;
                        }
                        pendingBackup = text;
                        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT)
                            .addCategory(Intent.CATEGORY_OPENABLE).setType("application/json")
                            .putExtra(Intent.EXTRA_TITLE, name);
                        startActivityForResult(intent, EXPORT);
                    } catch (JSONException | ActivityNotFoundException error) {
                        pendingBackup = null;
                        toast("No se pudo abrir el selector para guardar el respaldo.");
                    }
                });
        } else {
            toast("Actualiza Android System WebView para poder exportar respaldos.");
            // Expose an explicit failure instead of silently attempting an unsupported blob download.
            web.setDownloadListener((url, agent, disposition, mime, size) ->
                toast("Actualiza Android System WebView para exportar respaldos."));
        }
        web.loadUrl(HOME);
    }

    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
            && uri.getPort() == -1 && uri.getPath() != null && uri.getPath().startsWith("/assets/web/");
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
        if (request == IMPORT && fileCallback != null) {
            fileCallback.onReceiveValue(uri == null ? null : new Uri[]{uri});
            fileCallback = null;
        }
        if (request == EXPORT) {
            String backup = pendingBackup;
            pendingBackup = null;
            if (uri == null || backup == null) return;
            try (OutputStream stream = getContentResolver().openOutputStream(uri, "wt")) {
                if (stream == null) throw new java.io.IOException("Sin acceso al archivo");
                stream.write(backup.getBytes(StandardCharsets.UTF_8));
                toast("Respaldo guardado.");
            } catch (java.io.IOException | SecurityException error) {
                toast("No se pudo guardar. Vuelve a exportar el respaldo.");
            }
        }
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        web.destroy();
        super.onDestroy();
    }

    private void toast(String message) { Toast.makeText(this, message, Toast.LENGTH_LONG).show(); }
}
