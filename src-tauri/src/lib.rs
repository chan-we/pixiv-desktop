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
