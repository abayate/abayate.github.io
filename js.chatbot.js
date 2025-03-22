// Replace "YOUR_OPENAI_API_KEY" with your actual OpenAI API key if you integrate with an LLM.
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";  
// URL_CHECK_API is not used in this demo; we integrate directly with VirusTotal.
const URL_CHECK_API = "";

// A simple function to check if the user input is a URL.
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
    // If the input is a URL, check its safety using VirusTotal.
    const safetyResult = await checkUrlWithVirusTotal(text);
    addMessage(safetyResult, "bot");
  } else {
    // Otherwise, give a generic chatbot response.
    const response = "This is a demo response. For full functionality, integrate with an LLM.";
    addMessage(response, "bot");
  }
}

// Function to encode a URL in Base64 (as required by VirusTotal) and remove trailing '='.
function encodeUrl(url) {
  return btoa(url).replace(/=+$/, "");
}

async function checkUrlWithVirusTotal(url) {
  const encodedUrl = encodeUrl(url);
  // Insert your VirusTotal API key below.
  const apiKey = '4120ac02868cc1d791f749bce058ccbfc7810883f979033369213c4d879a21ad';
  const endpoint = `https://www.virustotal.com/api/v3/urls/${encodedUrl}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-apikey": apiKey
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
