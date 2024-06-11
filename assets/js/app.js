document.addEventListener("DOMContentLoaded", (event) => {

	// Start Review
	var progressCircles = document.querySelectorAll(".progress-circle");
	progressCircles.forEach(function (circle) {
		var progress = circle.getAttribute("data-progress");
		if (progress === "100") {
			var reviewButton = circle.closest("tr").querySelector(".review-button");
			reviewButton.disabled = false;
		}
	});
	// End Review

	// Load the YouTube Iframe API script
	var tag = document.createElement("script");
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName("script")[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	let player;
	let activeLectureId;
	let currentQuiz = 0;
	const quizTimes = [2, 10, 15]; // Example quiz times in seconds

	// Function to find and log the active video lecture list item
	function findAndLogActiveVideoLecture() {
		const activeItem = document.querySelector(".lecture-list__item.active");

		// If an active item is found and it's an HTMLElement
		if (activeItem && activeItem instanceof HTMLElement) {
			// Check if the active item has a data-type attribute with value 'video'
			if (activeItem.getAttribute("data-type") === "video") {
				activeLectureId = activeItem.getAttribute("data-lecture-id");
				document.getElementById("player").style.display = "block";
			} else if (activeItem.getAttribute("data-type") === "text") {
				activeLectureId = null;
				document.getElementById("player").style.display = "none";
				const noteId = activeItem.getAttribute("data-note-id");
				toggleTextNoteVisibility(noteId);
			} else {
				console.log("Unsupported lecture type.");
			}
		} else if (activeItem) {
			console.log("Active item is not a valid HTMLElement.");
		} else {
			console.log("No active lecture list item found.");
		}
	}

	// This function is called by the YouTube Iframe API once it's ready
	window.onYouTubeIframeAPIReady = function () {
		findAndLogActiveVideoLecture();

		if (activeLectureId) {
			player = new YT.Player("player", {
				width: "100%",
				videoId: activeLectureId,
				startSeconds: 0,
				events: {
					onReady: onPlayerReady,
					onStateChange: onPlayerStateChange,
				},
			});
		}
	};

	function onPlayerReady(event) {
		event.target.playVideo();
	}

	function onPlayerStateChange(event) {
		if (event.data == YT.PlayerState.PLAYING) {
			checkQuiz();
		}
	}

	function checkQuiz() {
		var currentTime = player.getCurrentTime();
		var quizWrapper = document.querySelector(".quiz-wrapper");

		if (
			currentQuiz < quizTimes.length &&
			currentTime >= quizTimes[currentQuiz]
		) {
			player.pauseVideo();
			const quizElement = document.getElementById("quiz" + (currentQuiz + 1));
			quizElement.style.display = "block";
			quizElement.parentElement.style.display = "block";

			if (quizWrapper) {
				quizWrapper.scrollIntoView({ behavior: "smooth" });
			}
		} else {
			setTimeout(checkQuiz, 1000);
		}
	}

	function submitAnswer(quizNumber) {
		event.preventDefault(); // Prevent default form submission behavior
		const quizElement = document.getElementById("quiz" + quizNumber);
		console.log(quizElement);
		const inputsR = quizElement.querySelectorAll("input[type='radio']:checked");
		const inputsC = quizElement.querySelectorAll("input[type='checkbox']:checked");

		if (inputsR.length === 1 && inputsC.length === 1) {
			quizElement.style.display = "none";
			quizElement.classList.add("d-none");
			currentQuiz++;
			player.playVideo();
		} else {
			alert("Please answer all questions to continue.");
		}
	}

	// Add event listeners for submit buttons
	document.querySelectorAll("[submit-quiz]").forEach((button) => {
		button.addEventListener("click", function () {
			const quizNumber = this.closest(".quiz").id.replace("quiz", "");
			submitAnswer(quizNumber);
		});
	});

	// Function to reset the quiz
	function resetQuiz() {
		if (player) {
			player.pauseVideo(); // Pause the active video
		}
		document.querySelectorAll(".quiz").forEach((quiz) => {
			quiz.style.display = "none";
			quiz.parentElement.style.display = "none";
		});
		currentQuiz = 0;
	}

	// Update the event listener to handle PDF notes
	document.querySelectorAll(".lecture-list__item").forEach((item) => {
		item.addEventListener("click", function () {
			// Remove active class from all items
			document
				.querySelectorAll(".lecture-list__item")
				.forEach((i) => i.classList.remove("active"));
			// Add active class to the clicked item
			this.classList.add("active");

			// Reset the quiz
			resetQuiz();

			// Fetch the data-lecture-id value
			const lectureId = this.getAttribute("data-lecture-id");
			const lectureType = this.getAttribute("data-type");

			// Update the player video if the type is video
			if (lectureType === "video") {
				activeLectureId = lectureId;
				document.getElementById("player").style.display = "block";
				toggleTextNoteVisibility(null); // Hide all text notes
				togglePdfNoteVisibility(null); // Hide all PDF notes
				player.loadVideoById(activeLectureId);
			} else if (lectureType === "text") {
				activeLectureId = null;
				document.getElementById("player").style.display = "none";
				const noteId = this.getAttribute("data-note-id");
				toggleTextNoteVisibility(noteId); // Show the selected text note
				togglePdfNoteVisibility(null); // Hide all PDF notes
			} else if (lectureType === "pdf") {
				activeLectureId = null;
				document.getElementById("player").style.display = "none";
				const noteId = this.getAttribute("data-note-id");
				toggleTextNoteVisibility(null); // Hide all text notes
				togglePdfNoteVisibility(noteId); // Show the selected PDF note
			} else {
				console.log("Unsupported lecture type.");
			}
		});
	});

	// Function to toggle the visibility of text notes
	function toggleTextNoteVisibility(noteId) {
		document.querySelectorAll(".text-notes").forEach((note) => {
			if (noteId && note.id === noteId) {
				note.classList.remove("d-none");
			} else {
				note.classList.add("d-none");
			}
		});
	}

	// Function to toggle the visibility of PDF notes
	function togglePdfNoteVisibility(noteId) {
		document.querySelectorAll(".pdf-notes").forEach((note) => {
			if (noteId && note.id === noteId) {
				note.classList.remove("d-none"); // Show the selected PDF note
			} else {
				note.classList.add("d-none"); // Hide other PDF notes
			}
		});
	}

	// Function to handle PDF interactions
	function handlePdfInteractions(noteId) {
		const pdfFrame = document.getElementById("pdfFrame" + noteId);
		const pdfHeader = document.querySelector(
			"#pdfNote" + noteId + " .pdf-header"
		);
		const pdfQuiz = document.getElementById("pdfQuiz" + noteId);
		const printBtn = document.getElementById("printBtn" + noteId);
		const zoomInBtn = document.getElementById("zoomInBtn" + noteId);
		const zoomOutBtn = document.getElementById("zoomOutBtn" + noteId);
		const markCompletedBtn = document.getElementById(
			"markCompletedBtn" + noteId
		);
		const backToPdfBtn = document.getElementById("backToPdf" + noteId);
		const submitQuizBtn = document.getElementById("submitQuiz" + noteId);
		let scale = 1; // Initial scale for zoom

		printBtn.addEventListener("click", function () {
			pdfFrame.contentWindow.print();
		});

		zoomInBtn.addEventListener("click", function () {
			scale += 0.1;
			pdfFrame.style.transform = `scale(${scale})`;
			pdfFrame.style.transformOrigin = "0 0";
		});

		zoomOutBtn.addEventListener("click", function () {
			if (scale > 0.1) {
				scale -= 0.1;
				pdfFrame.style.transform = `scale(${scale})`;
				pdfFrame.style.transformOrigin = "0 0";
			}
		});

		markCompletedBtn.addEventListener("click", function () {
			pdfFrame.style.display = "none";
			pdfHeader.style.display = "none";
			pdfQuiz.classList.remove("d-none");
		});

		backToPdfBtn.addEventListener("click", function () {
			pdfFrame.style.display = "block";
			pdfHeader.style.display = "flex";
			pdfQuiz.classList.add("d-none");
		});

		// submitQuizBtn.addEventListener("click", function () {
		// 	alert("Quiz submitted for PDF " + noteId);
		// 	// Add your code here to handle the quiz submission
		// });
	}

	// Call handlePdfInteractions for each PDF note
	document.querySelectorAll(".pdf-notes").forEach((note) => {
		const noteId = note.id.replace("pdfNote", "");
		handlePdfInteractions(noteId);
	});
});
