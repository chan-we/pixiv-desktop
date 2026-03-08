use tauri::http::Response as HttpResponse;
use tauri::Manager;
use tauri::WebviewWindow;

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

fn pixiv_client() -> reqwest::Client {
    reqwest::Client::new()
}

const PIXIV_REFERER: &str = "https://app-api.pixiv.net/";
const PIXIV_UA: &str = "PixivIOSApp/7.13.3 (iOS 15.1; iPhone13,2)";

#[tauri::command]
async fn download_image(url: String, path: String) -> Result<(), String> {
    let client = pixiv_client();
    let resp = client
        .get(&url)
        .header("Referer", PIXIV_REFERER)
        .header("User-Agent", PIXIV_UA)
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            eprintln!("[Rust] single-instance callback triggered, argv: {:?}, cwd: {:?}", argv, _cwd);
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
        .invoke_handler(tauri::generate_handler![download_image])
        .register_asynchronous_uri_scheme_protocol("pximg", |_ctx, request, responder| {
            let path_and_query = request
                .uri()
                .path_and_query()
                .map(|pq| pq.as_str())
                .unwrap_or("/");
            let pximg_url = format!("https://i.pximg.net{}", path_and_query);

            tauri::async_runtime::spawn(async move {
                let client = pixiv_client();
                match client
                    .get(&pximg_url)
                    .header("Referer", PIXIV_REFERER)
                    .header("User-Agent", PIXIV_UA)
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
            eprintln!("[Rust] app setup starting, platform: {}", std::env::consts::OS);

            if let Some(window) = app.get_webview_window("main") {
                #[cfg(debug_assertions)]
                window.open_devtools();

                log_to_webview(&window, &format!(
                    "app started, platform: {}, debug: {}",
                    std::env::consts::OS,
                    cfg!(debug_assertions)
                ));
            }

            eprintln!("[Rust] app setup complete, deep-link schemes: pixiv://, pixiv-desktop://");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
