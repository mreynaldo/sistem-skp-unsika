document.getElementById("forgot-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.querySelector("input[type='email']").value;

  if(email.trim() === "") {
    alert("Silakan masukkan email Anda.");
  } else {
    alert("Link reset password sudah dikirim ke " + email);
    // Di real project, di sini kamu hubungkan ke backend
  }
});
