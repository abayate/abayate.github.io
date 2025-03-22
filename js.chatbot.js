// Your Hugging Face API token is now set here.
const HUGGINGFACE_API_TOKEN = "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";

// Simple function to check if input is a URL.
function isUrl(input) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(input);
}

const chatbotInput = document.getElementById("chatbotInput");
const chatbotMessages = document.getElementById("chatbotMessages");

chatbotInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const userText = chatbotInput.value.trim();
    chatbotInput.value = "";
    if (userText) {
      addMessage(userText, "user");
      processUserMessage(userText);
    }
  }
});

function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "user" ? "user-msg" : "bot-msg";
  msgDiv.textContent = text;
  chatbotMessages.appendChild(msgDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

async function processUserMessage(text) {
  if (isUrl(text)) {
    // If input is a URL, check its safety using VirusTotal.
    const safetyResult = await checkUrlWithVirusTotal(text);
    addMessage(safetyResult, "bot");
  } else {
    // Otherwise, get a response from the Hugging Face Inference API.
    const response = await getLLMResponse(text);
    addMessage(response, "bot");
  }
}

// Encode URL in Base64 (removing trailing "=") as required by VirusTotal.
function encodeUrl(url) {
  return btoa(url).replace(/=+$/, "");
}

async function checkUrlWithVirusTotal(url) {
  const encodedUrl = encodeUrl(url);
  // Insert your VirusTotal API key here.
  const vtApiKey = '4120ac02868cc1d791f749bce058ccbfc7810883f979033369213c4d879a21ad';
  const endpoint = `https://www.virustotal.com/api/v3/urls/${encodedUrl}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-apikey": vtApiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    const stats = data.data.attributes.last_analysis_stats;
    if (stats.malicious > 0) {
      return `Warning: This URL (${url}) is reported as malicious. Do NOT proceed.`;
    } else {
      return `This URL (${url}) is not flagged as malicious. Still, stay cautious.`;
    }
  } catch (error) {
    console.error("VirusTotal API error:", error);
    return "Error checking URL safety. Please try again later.";
  }
}

async function getLLMResponse(userPrompt) {
  // Build a prompt with context for the model.
  const prompt = `You are a cybersecurity expert specializing in phishing and URL safety. Answer the following question with detailed, expert advice:
  
User: ${userPrompt}
  
Answer:`;

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/bigscience/bloom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${HUGGINGFACE_API_TOKEN}`
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7
        }
      }),
    });
    
    const data = await response.json();
    if (Array.isArray(data) && data[0].generated_text) {
      // Remove the prompt from the output if it appears.
      return data[0].generated_text.replace(prompt, "").trim();
    } else if (data.error) {
      return `Error: ${data.error}`;
    } else {
      return "Sorry, I couldn't generate a response.";
    }
  } catch (error) {
    console.error("Hugging Face API error:", error);
    return "Error retrieving response from Hugging Face.";
  }
}
