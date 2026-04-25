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

function validatePasswordStrength(passwordFieldId, errorElementId) {
  const password = document.getElementById(passwordFieldId).value;
  const errorEl = document.getElementById(errorElementId);

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasLength = password.length >= 8;

  if (!hasLength || !hasUppercase || !hasLowercase || !hasDigit) {
    const messages = [];
    if (!hasLength) messages.push('at least 8 characters');
    if (!hasUppercase) messages.push('an uppercase letter');
    if (!hasLowercase) messages.push('a lowercase letter');
    if (!hasDigit) messages.push('a number');
    errorEl.innerText = 'Password must include: ' + messages.join(', ');
    errorEl.style.display = 'block';
    return false;
  }

  errorEl.style.display = 'none';
  return true;
}
