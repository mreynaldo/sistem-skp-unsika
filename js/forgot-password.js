document.getElementById("forgot-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const emailInput = document.querySelector("input[type='email']");
  const email = emailInput.value;
  const submitButton = document.querySelector(".btn-forgot");

  if (email.trim() === "") {
    alert("Silakan masukkan email Anda.");
    return;
  }

  // 1. Tampilkan status loading
  const originalButtonText = submitButton.textContent;
  submitButton.textContent = "Mengirim...";
  submitButton.disabled = true;
  emailInput.disabled = true;

  // 2. Simulasi proses pengiriman (misal: 2 detik)
  setTimeout(() => {
    // 3. Tampilkan pesan sukses
    alert("Link reset password telah dikirim ke " + email + " (Simulasi). Silakan periksa email Anda.");

    // 4. Kembalikan tombol ke keadaan semula
    submitButton.textContent = originalButtonText;
    submitButton.disabled = false;
    emailInput.disabled = false;
    emailInput.value = "";
    window.location.href = 'login.html';

  }, 2000); // Jeda 2000ms = 2 detik
});