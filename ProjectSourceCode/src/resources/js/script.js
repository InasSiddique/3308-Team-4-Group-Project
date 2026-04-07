function confirmPassword(event, passwordFieldId, confirmPasswordFieldId, messageId) {
	let passwordField = document.getElementById(passwordFieldId)
	let confirmPasswordField = document.getElementById(confirmPasswordFieldId)
	let message = document.getElementById(messageId)

	if (passwordField == null || confirmPasswordField == null || passwordField.value == undefined || confirmPasswordField.value == undefined) {
		return false
	}

	let match = passwordField.value == confirmPasswordField.value

	message.style.display = match ? "none" : "block"

	if (!match) {
		message.innerText = "Passwords don't match"
		return false
	}

	return true
}
