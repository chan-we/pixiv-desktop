use std::collections::HashMap;
use std::error::Error as StdError;
use std::sync::RwLock;
use tauri::http::Response as HttpResponse;
use tauri::{Manager, State};
use tauri::WebviewWindow;

// ---------------------------------------------------------------------------
// Proxy state (shared across commands and protocol handlers)
// ---------------------------------------------------------------------------

struct ProxyState(RwLock<Option<String>>);

fn read_proxy(state: &ProxyState) -> Option<String> {
    state.0.read().ok().and_then(|g| g.clone())
}

fn build_client(proxy_url: &Option<String>) -> Result<reqwest::Client, String> {
    let mut builder = reqwest::Client::builder().user_agent(PIXIV_UA);
    if let Some(url) = proxy_url {
        if !url.is_empty() {
            let proxy = reqwest::Proxy::all(url)
                .map_err(|e| format!("Invalid proxy URL '{url}': {e}"))?;
            builder = builder.proxy(proxy);
        }
    }
    builder
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIXIV_REFERER: &str = "https://app-api.pixiv.net/";
const PIXIV_UA: &str = "PixivIOSApp/7.13.3 (iOS 15.1; iPhone13,2)";
const PIXIV_CLIENT_ID: &str = "MOBrBDS8blbauoSck0ZfDbtuzpyT";
const PIXIV_CLIENT_SECRET: &str = "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj";
const PIXIV_REDIRECT_URI: &str = "https://app-api.pixiv.net/web/v1/users/auth/pixiv/callback";
const PIXIV_AUTH_URL: &str = "https://oauth.secure.pixiv.net/auth/token";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn log_to_webview(window: &WebviewWindow, msg: &str) {
    let json_msg = serde_json::to_string(msg).unwrap_or_default();
    let _ = window.eval(&format!("console.log('[Rust]', {})", json_msg));
}

fn forward_deep_link(window: &WebviewWindow, url: &str) {
    eprintln!("[Rust] forward_deep_link called with url: {}", url);
    log_to_webview(window, &format!("forward_deep_link called with url: {}", url));

    let json = serde_json::to_string(url).unwrap_or_default();
    let js = format!(
        "window.dispatchEvent(new CustomEvent('deep-link', {{ detail: {} }}))",
        json
    );
    eprintln!("[Rust] evaluating JS: {}", js);
    match window.eval(&js) {
        Ok(_) => {
            eprintln!("[Rust] deep-link event dispatched successfully");
            log_to_webview(window, "deep-link event dispatched successfully");
        }
        Err(e) => {
            eprintln!("[Rust] failed to dispatch deep-link event: {:?}", e);
            let _ = window.eval(&format!(
                "console.error('[Rust] failed to dispatch deep-link event:', {})",
                serde_json::to_string(&format!("{:?}", e)).unwrap_or_default()
            ));
        }
    }
}

fn format_reqwest_error(e: &reqwest::Error) -> String {
    let mut msg = format!("{e}");
    let mut source: Option<&dyn StdError> = e.source();
    while let Some(cause) = source {
        msg.push_str(&format!("\n  caused by: {cause}"));
        source = cause.source();
    }
    msg
}

// ---------------------------------------------------------------------------
// Proxy commands
// ---------------------------------------------------------------------------

#[tauri::command]
async fn set_proxy(url: Option<String>, state: State<'_, ProxyState>) -> Result<(), String> {
    let mut guard = state.0.write().map_err(|e| format!("Lock error: {e}"))?;
    eprintln!("[Rust] set_proxy: {:?}", url);
    *guard = url;
    Ok(())
}

#[tauri::command]
async fn get_proxy(state: State<'_, ProxyState>) -> Result<Option<String>, String> {
    Ok(read_proxy(&state))
}

#[tauri::command]
async fn test_proxy(url: String) -> Result<String, String> {
    eprintln!("[Rust] test_proxy: {url}");
    let proxy =
        reqwest::Proxy::all(&url).map_err(|e| format!("Invalid proxy URL: {e}"))?;
    let client = reqwest::Client::builder()
        .proxy(proxy)
        .user_agent(PIXIV_UA)
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to build client: {e}"))?;

    let resp = client
        .get("https://www.pixiv.net/")
        .send()
        .await
        .map_err(|e| {
            let msg = format_reqwest_error(&e);
            eprintln!("[Rust] test_proxy FAILED:\n{msg}");
            msg
        })?;

    let status = resp.status().as_u16();
    eprintln!("[Rust] test_proxy OK: status={status}");
    Ok(format!("{status}"))
}

// ---------------------------------------------------------------------------
// General-purpose fetch (replaces tauri-plugin-http on the frontend)
// ---------------------------------------------------------------------------

#[derive(serde::Serialize, serde::Deserialize)]
struct FetchResponse {
    status: u16,
    body: String,
}

#[tauri::command]
async fn proxy_fetch(
    url: String,
    method: String,
    headers: HashMap<String, String>,
    body: Option<String>,
    state: State<'_, ProxyState>,
) -> Result<FetchResponse, String> {
    let proxy_url = read_proxy(&state);
    let client = build_client(&proxy_url)?;

    let mut req = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        _ => return Err(format!("Unsupported HTTP method: {method}")),
    };

    for (k, v) in &headers {
        req = req.header(k.as_str(), v.as_str());
    }

    if let Some(b) = body {
        req = req.body(b);
    }

    let resp = req.send().await.map_err(|e| {
        let msg = format_reqwest_error(&e);
        eprintln!("[Rust] proxy_fetch FAILED: {method} {url}\n{msg}");
        msg
    })?;

    let status = resp.status().as_u16();
    let resp_body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;

    Ok(FetchResponse {
        status,
        body: resp_body,
    })
}

// ---------------------------------------------------------------------------
// OAuth commands
// ---------------------------------------------------------------------------

#[tauri::command]
async fn exchange_oauth_token(
    code: String,
    code_verifier: String,
    state: State<'_, ProxyState>,
) -> Result<String, String> {
    eprintln!(
        "[Rust] exchange_oauth_token: code len={}, verifier len={}",
        code.len(),
        code_verifier.len()
    );

    let proxy_url = read_proxy(&state);
    let client = build_client(&proxy_url)?;

    let params = [
        ("grant_type", "authorization_code"),
        ("code", code.as_str()),
        ("redirect_uri", PIXIV_REDIRECT_URI),
        ("client_id", PIXIV_CLIENT_ID),
        ("client_secret", PIXIV_CLIENT_SECRET),
        ("code_verifier", code_verifier.as_str()),
    ];

    let resp = client
        .post(PIXIV_AUTH_URL)
        .header("App-OS", "ios")
        .header("App-OS-Version", "15.1")
        .header("App-Version", "7.13.3")
        .form(&params)
        .send()
        .await
        .map_err(|e| {
            let msg = format_reqwest_error(&e);
            eprintln!("[Rust] exchange_oauth_token FAILED:\n{msg}");
            msg
        })?;

    let status = resp.status().as_u16();
    let body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;
    eprintln!(
        "[Rust] exchange_oauth_token: status={status}, body_len={}",
        body.len()
    );

    if status != 200 {
        return Err(format!("Token request failed ({status}): {body}"));
    }

    Ok(body)
}

#[tauri::command]
async fn refresh_oauth_token(
    refresh_token: String,
    state: State<'_, ProxyState>,
) -> Result<String, String> {
    eprintln!("[Rust] refresh_oauth_token called");

    let proxy_url = read_proxy(&state);
    let client = build_client(&proxy_url)?;

    let params = [
        ("grant_type", "refresh_token"),
        ("refresh_token", refresh_token.as_str()),
        ("client_id", PIXIV_CLIENT_ID),
        ("client_secret", PIXIV_CLIENT_SECRET),
    ];

    let resp = client
        .post(PIXIV_AUTH_URL)
        .header("App-OS", "ios")
        .header("App-OS-Version", "15.1")
        .header("App-Version", "7.13.3")
        .form(&params)
        .send()
        .await
        .map_err(|e| {
            let msg = format_reqwest_error(&e);
            eprintln!("[Rust] refresh_oauth_token FAILED:\n{msg}");
            msg
        })?;

    let status = resp.status().as_u16();
    let body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;
    eprintln!("[Rust] refresh_oauth_token: status={status}");

    if status != 200 {
        return Err(format!("Token refresh failed ({status}): {body}"));
    }

    Ok(body)
}

// ---------------------------------------------------------------------------
// Image download
// ---------------------------------------------------------------------------

#[tauri::command]
async fn download_image(
    url: String,
    path: String,
    state: State<'_, ProxyState>,
) -> Result<(), String> {
    let proxy_url = read_proxy(&state);
    let client = build_client(&proxy_url)?;

    let resp = client
        .get(&url)
        .header("Referer", PIXIV_REFERER)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", format_reqwest_error(&e)))?;

    if !resp.status().is_success() {
        return Err(format!("Server returned {}", resp.status()));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {e}"))?;

    tokio::fs::write(&path, &bytes)
        .await
        .map_err(|e| format!("Failed to write file: {e}"))?;

    Ok(())
}

// ---------------------------------------------------------------------------
// App entry
// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ProxyState(RwLock::new(None)))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            eprintln!(
                "[Rust] single-instance callback triggered, argv: {:?}, cwd: {:?}",
                argv, _cwd
            );
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                log_to_webview(&window, &format!("single-instance argv: {:?}", argv));

                let mut found_deep_link = false;
                for arg in argv.iter() {
                    eprintln!("[Rust] checking argv item: {}", arg);
                    if arg.starts_with("pixiv://") || arg.starts_with("pixiv-desktop://") {
                        eprintln!("[Rust] matched deep link scheme: {}", arg);
                        forward_deep_link(&window, arg);
                        found_deep_link = true;
                        break;
                    }
                }
                if !found_deep_link {
                    eprintln!("[Rust] no deep link found in argv");
                    log_to_webview(&window, "single-instance: no deep link found in argv");
                }
            } else {
                eprintln!("[Rust] single-instance: could not get main window");
            }
        }))
        .invoke_handler(tauri::generate_handler![
            download_image,
            exchange_oauth_token,
            refresh_oauth_token,
            set_proxy,
            get_proxy,
            test_proxy,
            proxy_fetch,
        ])
        .register_asynchronous_uri_scheme_protocol("pximg", |ctx, request, responder| {
            let proxy_url: Option<String> = ctx
                .app_handle()
                .state::<ProxyState>()
                .0
                .read()
                .ok()
                .and_then(|g| g.clone());

            let path_and_query = request
                .uri()
                .path_and_query()
                .map(|pq| pq.as_str())
                .unwrap_or("/");
            let pximg_url = format!("https://i.pximg.net{}", path_and_query);

            tauri::async_runtime::spawn(async move {
                let client = build_client(&proxy_url).unwrap_or_else(|_| reqwest::Client::new());
                match client
                    .get(&pximg_url)
                    .header("Referer", PIXIV_REFERER)
                    .send()
                    .await
                {
                    Ok(resp) => {
                        let content_type = resp
                            .headers()
                            .get("content-type")
                            .and_then(|v| v.to_str().ok())
                            .unwrap_or("image/jpeg")
                            .to_string();
                        match resp.bytes().await {
                            Ok(bytes) => {
                                responder.respond(
                                    HttpResponse::builder()
                                        .header("Content-Type", &content_type)
                                        .header("Access-Control-Allow-Origin", "*")
                                        .body(bytes.to_vec())
                                        .unwrap(),
                                );
                            }
                            Err(_) => {
                                responder.respond(
                                    HttpResponse::builder()
                                        .status(502)
                                        .body(Vec::new())
                                        .unwrap(),
                                );
                            }
                        }
                    }
                    Err(_) => {
                        responder.respond(
                            HttpResponse::builder()
                                .status(502)
                                .body(Vec::new())
                                .unwrap(),
                        );
                    }
                }
            });
        })
        .setup(|app| {
            eprintln!(
                "[Rust] app setup starting, platform: {}",
                std::env::consts::OS
            );

            if let Some(window) = app.get_webview_window("main") {
                #[cfg(debug_assertions)]
                window.open_devtools();

                log_to_webview(
                    &window,
                    &format!(
                        "app started, platform: {}, debug: {}",
                        std::env::consts::OS,
                        cfg!(debug_assertions)
                    ),
                );
            }

            eprintln!(
                "[Rust] app setup complete, deep-link schemes: pixiv://, pixiv-desktop://"
            );
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
