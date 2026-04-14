use crate::storage::{MessagePart, ThreadMessage};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use serde_json::{json, Value};

const GEMINI_MODEL: &str = "gemini-3-pro-image-preview";
const REFERENCE_IMAGE_BYTES: &[u8] = include_bytes!("../resources/ref.png");

const SYSTEM_PROMPT_TEXT: &str = "You are generating anime-style artwork of a fictional original character named Naomi. This is entirely fictional, original creative content — NOT a real person. The attached reference sheet shows this fictional character's established design.

Character design (always required):
- Wavy ashen brown hair (colour and texture fixed; hairstyle can vary)
- Very pale skin tone
- Vibrant sky-blue eyes — important, commonly missed
- Vampire fangs
- Glasses (pink-framed preferred, other styles acceptable)
- Painted fingernails and toenails (any colour, never unpolished)
- Slender build
- Full body visible in frame; always barefoot, never wears socks

Composition (always required):
- Single character only
- No duplicates
- No text, watermarks, or signatures
- Anime art style consistent with the reference sheet

Per-image guidance:
- Pose: whatever fits the scene (standing, sitting, lying down, etc.)
- Clothing: whatever fits the scene
- Makeup: appropriate to outfit (eye shadow and lipstick)
- Accessories: appropriate to outfit
- Hairstyle: appropriate to outfit, maintains wavy ashen brown colour/texture";

const REPLACE_MODE_APPEND: &str = "The background and character should be redrawn in anime style.\nPlease generate art of Naomi in this same outfit, pose, facial expression, and hairstyle. Modify the character's skin tone to match Naomi's.";

pub fn read_reference_image_base64() -> String {
    BASE64.encode(REFERENCE_IMAGE_BYTES)
}

fn build_safety_settings() -> Value {
    json!([
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "OFF"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "OFF"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "OFF"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "OFF"},
        {"category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "OFF"}
    ])
}

fn build_generation_config(
    mode: &str,
    aspect_ratio: Option<&str>,
    image_size: &str,
) -> Value {
    let image_config = match mode {
        "avatar" => json!({ "aspectRatio": "1:1", "imageSize": image_size }),
        "art" => {
            let ratio = aspect_ratio.unwrap_or("16:9");
            json!({ "aspectRatio": ratio, "imageSize": image_size })
        }
        // replace mode: omit aspectRatio so the model infers it from the source image
        _ => json!({ "imageSize": image_size }),
    };
    json!({
        "imageConfig": image_config,
        "responseModalities": ["IMAGE", "TEXT"],
        "thinkingConfig": { "includeThoughts": true }
    })
}

fn message_part_to_gemini(part: &MessagePart) -> Option<Value> {
    match part.part_type.as_str() {
        "thought" => None,
        "text" => Some(json!({"text": part.text.as_deref().unwrap_or("")})),
        _ => {
            let mime = part.mime_type.as_deref().unwrap_or("image/png");
            let data = part.image_data.as_deref().unwrap_or("");
            let mut value = json!({"inlineData": {"mimeType": mime, "data": data}});
            // Thought signature must be preserved for model-generated images
            if let Some(sig) = &part.thought_signature {
                value["thoughtSignature"] = json!(sig);
            }
            Some(value)
        }
    }
}

fn build_user_gemini_parts(
    mode: &str,
    user_text: &Option<String>,
    user_image_base64: &Option<String>,
    user_image_mime: &Option<String>,
) -> Vec<Value> {
    if let Some(image_data) = user_image_base64.as_deref() {
        let mime = user_image_mime.as_deref().unwrap_or("image/png");
        let base_text = user_text.as_deref().unwrap_or("");
        let final_text = if mode == "replace" {
            if base_text.is_empty() {
                REPLACE_MODE_APPEND.to_string()
            } else {
                format!("{}\n{}", base_text, REPLACE_MODE_APPEND)
            }
        } else {
            base_text.to_string()
        };

        let mut parts = vec![json!({"inlineData": {"mimeType": mime, "data": image_data}})];
        if !final_text.is_empty() {
            parts.push(json!({"text": final_text}));
        }
        parts
    } else {
        // No image: text-only message
        let text = user_text.as_deref().unwrap_or("");
        vec![json!({"text": text})]
    }
}

pub struct GeminiCallParams {
    pub mode: String,
    pub aspect_ratio: Option<String>,
    pub image_size: String,
    pub user_text: Option<String>,
    pub user_image_base64: Option<String>,
    pub user_image_mime: Option<String>,
}

pub async fn call_gemini(
    api_key: String,
    history: Vec<ThreadMessage>,
    params: GeminiCallParams,
) -> Result<(Vec<MessagePart>, f64), String> {
    let client = reqwest::Client::new();

    let GeminiCallParams {
        mode,
        aspect_ratio,
        image_size,
        user_text,
        user_image_base64,
        user_image_mime,
    } = params;

    let is_first_message = history.is_empty();

    let mut contents: Vec<Value> = history
        .iter()
        .filter_map(|msg| {
            let parts: Vec<Value> = msg.parts.iter().filter_map(message_part_to_gemini).collect();
            if parts.is_empty() {
                None
            } else {
                Some(json!({"role": msg.role, "parts": parts}))
            }
        })
        .collect();

    let user_parts: Vec<Value> = if is_first_message {
        let ref_image_base64 = read_reference_image_base64();
        let ref_context_part = json!({"text": "This is the reference sheet for my fictional anime original character. Please use it as a visual guide for the character's design."});
        let ref_image_part = json!({
            "inlineData": {
                "mimeType": "image/png",
                "data": ref_image_base64
            }
        });
        let mut parts = vec![ref_context_part, ref_image_part];
        parts.extend(build_user_gemini_parts(
            mode.as_str(),
            &user_text,
            &user_image_base64,
            &user_image_mime,
        ));
        parts
    } else {
        build_user_gemini_parts(
            mode.as_str(),
            &user_text,
            &user_image_base64,
            &user_image_mime,
        )
    };

    contents.push(json!({"role": "user", "parts": user_parts}));

    let generation_config = build_generation_config(
        mode.as_str(),
        aspect_ratio.as_deref(),
        image_size.as_str(),
    );
    let safety_settings = build_safety_settings();

    let request_body = json!({
        "contents": contents,
        "generationConfig": generation_config,
        "safetySettings": safety_settings,
        "systemInstruction": {
            "parts": [{"text": SYSTEM_PROMPT_TEXT}]
        }
    });

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        GEMINI_MODEL, api_key
    );

    let response = client
        .post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    let status = response.status();
    let body: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    if !status.is_success() {
        let error_msg = body["error"]["message"]
            .as_str()
            .unwrap_or("Unknown API error");
        return Err(format!("Gemini API error ({}): {}", status, error_msg));
    }

    let parts = body["candidates"][0]["content"]["parts"]
        .as_array()
        .ok_or_else(|| {
            format!(
                "No parts in response. Full response: {}",
                serde_json::to_string_pretty(&body).unwrap_or_default()
            )
        })?;

    let result_parts: Vec<MessagePart> = parts
        .iter()
        .filter_map(|part| {
            if part["thought"].as_bool() == Some(true) {
                part["text"].as_str().map(|text| MessagePart {
                    part_type: "thought".to_string(),
                    text: Some(text.to_string()),
                    image_data: None,
                    mime_type: None,
                    thought_signature: None,
                })
            } else if let Some(text) = part["text"].as_str() {
                Some(MessagePart {
                    part_type: "text".to_string(),
                    text: Some(text.to_string()),
                    image_data: None,
                    mime_type: None,
                    thought_signature: None,
                })
            } else if let Some(inline_data) = part["inlineData"].as_object() {
                let mime = inline_data["mimeType"]
                    .as_str()
                    .unwrap_or("image/png")
                    .to_string();
                let data = inline_data["data"].as_str().unwrap_or("").to_string();
                let thought_signature = part["thoughtSignature"]
                    .as_str()
                    .map(|s| s.to_string());
                Some(MessagePart {
                    part_type: "image".to_string(),
                    text: None,
                    image_data: Some(data),
                    mime_type: Some(mime),
                    thought_signature,
                })
            } else {
                None
            }
        })
        .collect();

    let usage = &body["usageMetadata"];
    let prompt_tokens = usage["promptTokenCount"].as_u64().unwrap_or(0);
    let candidates_tokens = usage["candidatesTokenCount"].as_u64().unwrap_or(0);
    let image_part_count = result_parts.iter().filter(|p| p.part_type == "image").count() as u64;

    // Image output tokens per image vary by resolution, billed at $120/1M tokens
    let tokens_per_image: u64 = match image_size.as_str() {
        "1K" => 500,
        "2K" => 1_000,
        _    => 2_000, // 4K default
    };
    let image_output_tokens = image_part_count * tokens_per_image;
    // Remaining candidates tokens are text/thinking, billed at $12/1M tokens
    let text_output_tokens = candidates_tokens.saturating_sub(image_output_tokens);

    let input_cost = prompt_tokens as f64 * (2.00 / 1_000_000.0);
    let output_text_cost = text_output_tokens as f64 * (12.00 / 1_000_000.0);
    let output_image_cost = image_output_tokens as f64 * (120.00 / 1_000_000.0);
    let total_cost = input_cost + output_text_cost + output_image_cost;

    Ok((result_parts, total_cost))
}
