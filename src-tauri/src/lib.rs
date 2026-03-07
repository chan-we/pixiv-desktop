use tauri::http::Response as HttpResponse;
use tauri::Manager;
use tauri::WebviewWindow;

fn forward_deep_link(window: &WebviewWindow, url: &str) {
    let json = serde_json::to_string(url).unwrap_or_default();
    let js = format!(
        "window.dispatchEvent(new CustomEvent('deep-link', {{ detail: {} }}))",
        json
    );
    let _ = window.eval(&js);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();

                for arg in argv.iter() {
                    if arg.starts_with("pixiv://") || arg.starts_with("pixiv-desktop://") {
                        forward_deep_link(&window, arg);
                        break;
                    }
                }
            }
        }))
        .register_asynchronous_uri_scheme_protocol("pximg", |_ctx, request, responder| {
            let path_and_query = request
                .uri()
                .path_and_query()
                .map(|pq| pq.as_str())
                .unwrap_or("/");
            let pximg_url = format!("https://i.pximg.net{}", path_and_query);

            tauri::async_runtime::spawn(async move {
                let client = reqwest::Client::new();
                match client
                    .get(&pximg_url)
                    .header("Referer", "https://app-api.pixiv.net/")
                    .header(
                        "User-Agent",
                        "PixivIOSApp/7.13.3 (iOS 15.1; iPhone13,2)",
                    )
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
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                let window = _app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
