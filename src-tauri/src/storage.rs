use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessagePart {
    #[serde(rename = "type")]
    pub part_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(rename = "imageData", skip_serializing_if = "Option::is_none")]
    pub image_data: Option<String>,
    #[serde(rename = "mimeType", skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
    // Required by the Gemini API when sending model-generated images back in history
    #[serde(rename = "thoughtSignature", skip_serializing_if = "Option::is_none")]
    pub thought_signature: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadMessage {
    pub role: String,
    pub parts: Vec<MessagePart>,
    #[serde(rename = "costUsd", skip_serializing_if = "Option::is_none")]
    pub cost_usd: Option<f64>,
}

fn default_image_size() -> String {
    "4K".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Thread {
    pub id: String,
    pub name: String,
    pub mode: String,
    #[serde(rename = "aspectRatio", skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    #[serde(rename = "imageSize", default = "default_image_size")]
    pub image_size: String,
    pub messages: Vec<ThreadMessage>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Config {
    #[serde(rename = "apiKey")]
    pub api_key: String,
}

fn get_app_data_dir() -> PathBuf {
    let data_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("com.naomi.tatsumi");

    fs::create_dir_all(&data_dir).unwrap_or(());
    data_dir
}

fn get_threads_path() -> PathBuf {
    get_app_data_dir().join("threads.json")
}

pub fn get_config_path() -> PathBuf {
    get_app_data_dir().join("config.json")
}

pub fn load_config_from_disk() -> Config {
    let path = get_config_path();
    if !path.exists() {
        return Config::default();
    }

    let content = fs::read_to_string(&path).unwrap_or_else(|_| "{}".to_string());
    serde_json::from_str(&content).unwrap_or_else(|_| Config::default())
}

pub fn save_config_to_disk(config: Config) -> Result<(), String> {
    let path = get_config_path();
    let content = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn load_threads_from_disk() -> Vec<Thread> {
    let path = get_threads_path();
    if !path.exists() {
        return Vec::new();
    }

    let content = fs::read_to_string(&path).unwrap_or_else(|_| "[]".to_string());
    serde_json::from_str(&content).unwrap_or_else(|_| Vec::new())
}

pub fn save_thread_to_disk(thread: Thread) -> Result<(), String> {
    let path = get_threads_path();
    let mut threads = load_threads_from_disk();

    if let Some(existing) = threads.iter_mut().find(|t| t.id == thread.id) {
        *existing = thread;
    } else {
        threads.push(thread);
    }

    let content = serde_json::to_string(&threads).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn delete_thread_from_disk(thread_id: &str) -> Result<(), String> {
    let path = get_threads_path();
    let mut threads = load_threads_from_disk();
    threads.retain(|t| t.id != thread_id);

    let content = serde_json::to_string(&threads).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}
