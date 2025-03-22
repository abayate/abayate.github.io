// Hugging Face API token
const HUGGINGFACE_API_TOKEN = "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";

// VirusTotal API key
const vtApiKey = '4120ac02868cc1d791f749bce058ccbfc7810883f979033369213c4d879a21ad';

// Grab DOM elements
const chatbotInput = document.getElementById("chatbotInput");
const chatbotMessages = document.getElementById("chatbotMessages");
const submitButton = document.getElementById("submitBtn");

// Listen for the Submit button click
submitButton.addEventListener("click", () => {
  processInput();
});

// Also listen for Enter key in the input
chatbotInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    processInput();
  }
});

function processInput() {
  const userText = chatbotInput.value.trim();
  if (!userText) return;

  // Show user's message
  addMessage(userText, "user");
  chatbotInput.value = "";

  // Check if it's a URL or a normal query
  if (isUrl(userText)) {
    checkUrlWithVirusTotal(userText)
      .then((result) => addMessage(result, "bot"))
      .catch((err) => {
        console.error(err);
        addMessage("Error checking URL. Please try again later.", "bot");
      });
  } else {
    getLLMResponse(userText)
      .then((response) => addMessage(response, "bot"))
      .catch((err) => {
        console.error(err);
        addMessage("Error retrieving response from Hugging Face.", "bot");
      });
  }
}

function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "user" ? "user-msg" : "bot-msg";
  msgDiv.textContent = text;
  chatbotMessages.appendChild(msgDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Simple URL check
function isUrl(input) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(input);
}

// Encode URL for VirusTotal
function encodeUrl(url) {
  return btoa(url).replace(/=+$/, "");
}

async function checkUrlWithVirusTotal(url) {
  console.log("Checking URL with VirusTotal:", url);
  const encodedUrl = encodeUrl(url);
  const endpoint = `https://www.virustotal.com/api/v3/urls/${encodedUrl}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "x-apikey": vtApiKey
    }
  });

  if (!response.ok) {
    throw new Error(`VirusTotal error: ${response.status}`);
  }

  const data = await response.json();
  const stats = data.data.attributes.last_analysis_stats;
  if (stats.malicious > 0) {
    return `Warning: This URL (${url}) is reported as malicious. Do NOT proceed.`;
  } else {
    return `This URL (${url}) is not flagged as malicious. Still, stay cautious.`;
  }
}

async function getLLMResponse(userPrompt) {
  console.log("Sending prompt to Hugging Face:", userPrompt);
  const prompt = `You are a cybersecurity expert specializing in phishing and URL safety. Answer the following question with detailed, expert advice:
  
User: ${userPrompt}
  
Answer:`;

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

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data) && data[0].generated_text) {
    // Remove the prompt from the output if it appears
    return data[0].generated_text.replace(prompt, "").trim();
  } else if (data.error) {
    return `Error: ${data.error}`;
  } else {
    return "Sorry, I couldn't generate a response.";
  }
}
