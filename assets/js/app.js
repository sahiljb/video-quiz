document.addEventListener("DOMContentLoaded", (event) => {
	// Load the YouTube Iframe API script
	var tag = document.createElement("script");
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName("script")[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	let player;
	let activeLectureId;
	let currentQuiz = 0;
	const quizTimes = [5, 10, 15]; // Example quiz times in seconds

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
		if (
			currentQuiz < quizTimes.length &&
			currentTime >= quizTimes[currentQuiz]
		) {
			player.pauseVideo();
			const quizElement = document.getElementById("quiz" + (currentQuiz + 1));
			quizElement.style.display = "block";
			quizElement.parentElement.style.display = "block";
		} else {
			setTimeout(checkQuiz, 1000);
		}
	}

	function submitAnswer(quizNumber) {
		var answer = document.getElementById("answer" + quizNumber).value;
		if (answer.trim() !== "") {
			const quizElement = document.getElementById("quiz" + quizNumber);
			quizElement.style.display = "none";
			quizElement.parentElement.style.display = "none";
			currentQuiz++;
			player.playVideo();
		} else {
			alert("Please answer the question to continue.");
		}
	}

	// Add event listeners for submit buttons
	document.querySelectorAll("[submit-quiz]").forEach((button) => {
		button.addEventListener("click", function () {
			const quizNumber = this.closest(".quiz").id.replace("quiz", "");
			submitAnswer(quizNumber);
		});
	});

	// Event listener to handle clicks on lecture list items
	document.querySelectorAll(".lecture-list__item").forEach((item) => {
		item.addEventListener("click", function () {
			// Remove active class from all items
			document
				.querySelectorAll(".lecture-list__item")
				.forEach((i) => i.classList.remove("active"));
			// Add active class to the clicked item
			this.classList.add("active");

			// Fetch the data-lecture-id value
			const lectureId = this.getAttribute("data-lecture-id");
			const lectureType = this.getAttribute("data-type");

			// Update the player video if the type is video
			if (lectureType === "video") {
				activeLectureId = lectureId;
				document.getElementById("player").style.display = "block";
				toggleTextNoteVisibility(null); // Hide all text notes
				player.loadVideoById(activeLectureId);
			} else if (lectureType === "text") {
				activeLectureId = null;
				document.getElementById("player").style.display = "none";
				const noteId = this.getAttribute("data-note-id");
				toggleTextNoteVisibility(noteId); // Show the selected text note
			} else {
				console.log("Unsupported lecture type.");
			}
		});
	});

	// Function to toggle the visibility of text notes
	function toggleTextNoteVisibility(noteId) {
		document.querySelectorAll(".text-notes").forEach((note) => {
			if (noteId && note.id === noteId) {
				note.classList.remove("d-none"); // Show the selected text note
			} else {
				note.classList.add("d-none"); // Hide other text notes
			}
		});
	}
});
