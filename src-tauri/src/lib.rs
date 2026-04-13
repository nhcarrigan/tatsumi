mod gemini;
mod storage;

use gemini::{call_gemini, read_reference_image_base64};
use serde::Serialize;
use storage::{
    delete_thread_from_disk, load_config_from_disk, load_threads_from_disk, save_config_to_disk,
    save_thread_to_disk, Config, MessagePart, Thread, ThreadMessage,
};

#[derive(Serialize)]
struct SendMessageResult {
    parts: Vec<MessagePart>,
    #[serde(rename = "costUsd")]
    cost_usd: f64,
}

#[tauri::command]
async fn load_threads() -> Result<Vec<Thread>, String> {
    Ok(load_threads_from_disk())
}

#[tauri::command]
async fn save_thread(thread: Thread) -> Result<(), String> {
    save_thread_to_disk(thread)
}

#[tauri::command]
async fn delete_thread(thread_id: String) -> Result<(), String> {
    delete_thread_from_disk(&thread_id)
}

#[tauri::command]
async fn read_reference_image() -> String {
    read_reference_image_base64()
}

#[tauri::command]
async fn load_config() -> Result<Config, String> {
    Ok(load_config_from_disk())
}

#[tauri::command]
async fn save_config(config: Config) -> Result<(), String> {
    save_config_to_disk(config)
}

#[tauri::command]
async fn send_message(
    api_key: String,
    mode: String,
    aspect_ratio: Option<String>,
    image_size: String,
    history: Vec<ThreadMessage>,
    user_text: Option<String>,
    user_image_base64: Option<String>,
    user_image_mime: Option<String>,
) -> Result<SendMessageResult, String> {
    let (parts, cost_usd) = call_gemini(
        api_key,
        mode,
        aspect_ratio,
        image_size,
        history,
        user_text,
        user_image_base64,
        user_image_mime,
    )
    .await?;
    Ok(SendMessageResult { parts, cost_usd })
}

#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| format!("Failed to open URL: {e}"))
}

#[tauri::command]
async fn save_image(
    app: tauri::AppHandle,
    base64_data: String,
    mime_type: String,
    file_name: String,
) -> Result<(), String> {
    use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
    use tauri_plugin_dialog::DialogExt;

    let extension = if mime_type.contains("jpeg") || mime_type.contains("jpg") {
        "jpg"
    } else {
        "png"
    };

    let path = app
        .dialog()
        .file()
        .add_filter("Image", &[extension])
        .set_file_name(&file_name)
        .blocking_save_file();

    if let Some(file_path) = path {
        let bytes = BASE64
            .decode(&base64_data)
            .map_err(|e| format!("Failed to decode image: {}", e))?;
        let path_buf: std::path::PathBuf = file_path.into_path().map_err(|e| format!("Invalid path: {}", e))?;
        std::fs::write(&path_buf, bytes).map_err(|e| format!("Failed to save: {}", e))?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            delete_thread,
            load_config,
            load_threads,
            open_url,
            read_reference_image,
            save_config,
            save_image,
            save_thread,
            send_message,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
