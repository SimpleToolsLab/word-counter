const textInput = document.getElementById("textInput");

const wordCount = document.getElementById("wordCount");
const characterCount = document.getElementById("characterCount");
const sentenceCount = document.getElementById("sentenceCount");
const paragraphCount = document.getElementById("paragraphCount");
const charactersNoSpaces = document.getElementById("charactersNoSpaces");

const readingTime = document.getElementById("readingTime");
const speakingTime = document.getElementById("speakingTime");

const clearButton = document.getElementById("clearButton");
const copyButton = document.getElementById("copyButton");

const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
function updateCounts() {

    const text = textInput.value;

    // WORDS
    const words = text.trim()
        ? text.trim().split(/\s+/)
        : [];

    wordCount.textContent = words.length;


    // CHARACTERS
    characterCount.textContent = text.length;


    // CHARACTERS WITHOUT SPACES
    const noSpaces = text.replace(/\s/g, "");
    charactersNoSpaces.textContent = noSpaces.length;


 // SENTENCES
const trimmedText = text.trim();

let sentences = 0;

if (trimmedText.length > 0) {

    // Protect decimals such as 3.14
    let sentenceText = trimmedText.replace(/(\d)\.(\d)/g, "$1§$2");
    // Protect common titles and abbreviations
sentenceText = sentenceText.replace(
    /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St)\./gi,
    "$1§"
);

   // Protect dots inside abbreviations such as U.S.A. and U.K.
// but keep the final period so it can end a sentence
sentenceText = sentenceText.replace(
    /\b(?:[A-Za-z]\.){2,}/g,
    match => {
        const hasFinalPeriod = match.endsWith(".");
        const letters = match.replace(/\./g, "§");

        return hasFinalPeriod
            ? letters.slice(0, -1) + "."
            : letters;
    }
);

    // Count groups of sentence-ending punctuation as ONE ending
    const endings = sentenceText.match(/[.!?]+(?=\s|$)/g);

    sentences = endings ? endings.length : 0;

    // If the final sentence has no punctuation, count it too
    if (!/[.!?]\s*$/.test(sentenceText)) {
        sentences++;
    }
}

sentenceCount.textContent = sentences;


// PARAGRAPHS
const paragraphs = text
    .trim()
    .split(/\n\s*\n+/)
    .filter(paragraph => paragraph.trim().length > 0);

paragraphCount.textContent = text.trim() === "" ? 0 : paragraphs.length;


    // READING TIME
    const readingMinutes = words.length / 225;

    readingTime.textContent =
        words.length === 0
            ? "0 min"
            : readingMinutes < 1
            ? "< 1 min"
            : Math.ceil(readingMinutes) + " min";


    // SPEAKING TIME
    const speakingMinutes = words.length / 130;

    speakingTime.textContent =
        words.length === 0
            ? "0 min"
            : speakingMinutes < 1
            ? "< 1 min"
            : Math.ceil(speakingMinutes) + " min";
}


// UPDATE WHILE TYPING
textInput.addEventListener("input", updateCounts);


// CLEAR TEXT
clearButton.addEventListener("click", function () {

    textInput.value = "";

    updateCounts();

    textInput.focus();

});


// COPY TEXT
copyButton.addEventListener("click", async function () {

    if (!textInput.value.trim()) {
        return;
    }

    try {

        await navigator.clipboard.writeText(textInput.value);

        const originalText = copyButton.textContent;

        copyButton.textContent = "Copied ✓";

        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 1500);

    } catch (error) {

        console.error("Could not copy text:", error);

    }

});


// INITIAL COUNT
updateCounts();
// DOCUMENT UPLOAD


const uploadBox = document.querySelector(".upload-box");

fileInput.addEventListener("change", function () {

    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    fileStatus.textContent = `Processing ${file.name}...`;

    fileStatus.className = "file-status processing";

    const fileName = file.name.toLowerCase();

    // TXT FILE
    if (fileName.endsWith(".txt")) {

        const reader = new FileReader();

        reader.onload = function (event) {

            textInput.value = event.target.result;

            updateCounts();
fileStatus.textContent = `✓ ${file.name} processed successfully`;
fileStatus.className = "file-status success";
            textInput.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        };

        reader.onerror = function () {
            alert("We couldn't read this file.");
        };

        reader.readAsText(file);

   } else if (fileName.endsWith(".docx")) {

    const reader = new FileReader();

    reader.onload = async function (event) {

        try {

            const arrayBuffer = event.target.result;

            const result = await mammoth.extractRawText({
                arrayBuffer: arrayBuffer
            });

            textInput.value = result.value;

            updateCounts();
fileStatus.textContent = `✓ ${file.name} processed successfully`;
fileStatus.className = "file-status success";


            textInput.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        } catch (error) {

            console.error(error);
            alert("We couldn't read this Word document.");
            fileStatus.textContent = "✕ Could not process this Word document.";
fileStatus.className = "file-status error";

        }

    };

    reader.readAsArrayBuffer(file);

} else if (fileName.endsWith(".pdf")) {

    const reader = new FileReader();

    reader.onload = async function (event) {

        try {

            const typedArray = new Uint8Array(event.target.result);

            pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

            const pdf = await pdfjsLib.getDocument(typedArray).promise;

            let fullText = "";

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {

                const page = await pdf.getPage(pageNumber);

                const content = await page.getTextContent();

                const pageText = content.items
                    .map(item => item.str)
                    .join(" ");

                fullText += pageText + "\n\n";
            }

            textInput.value = fullText.trim();

            updateCounts();

            fileStatus.textContent = `✓ ${file.name} processed successfully`;
            fileStatus.className = "file-status success";

            textInput.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        } catch (error) {

            console.error(error);

            alert("We couldn't read this PDF document.");
            fileStatus.textContent = "✕ Could not process this PDF file.";
fileStatus.className = "file-status error";

        }

    };

    reader.readAsArrayBuffer(file);

} else {

    alert("Please upload a PDF, DOCX or TXT file.");
    fileStatus.textContent = "✕ Unsupported file type. Please use PDF, DOCX or TXT.";
fileStatus.className = "file-status error";

}

});

// DRAG AND DROP

["dragenter", "dragover"].forEach(eventName => {

    uploadBox.addEventListener(eventName, function (event) {

        event.preventDefault();
        event.stopPropagation();

        uploadBox.classList.add("drag-active");

    });

});


["dragleave", "drop"].forEach(eventName => {

    uploadBox.addEventListener(eventName, function (event) {

        event.preventDefault();
        event.stopPropagation();

        uploadBox.classList.remove("drag-active");

    });

});


uploadBox.addEventListener("drop", function (event) {

    const files = event.dataTransfer.files;

    if (files.length === 0) {
        return;
    }

    const file = files[0];

    const dataTransfer = new DataTransfer();

    dataTransfer.items.add(file);

    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event("change"));

});