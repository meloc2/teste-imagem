
const imgbbApiKey = "b6333be733b544eda43cec8ccb9a0e72";

document.getElementById("generate").addEventListener("click", async () => {
  const image1 = document.getElementById("image1").files[0];
  const image2 = document.getElementById("image2").files[0];
  const status = document.getElementById("status");
  const video = document.getElementById("outputVideo");
  video.style.display = "none";
  video.src = "";

  if (!image1 || !image2) {
    alert("Por favor, selecione duas imagens.");
    return;
  }

  status.innerText = "Enviando imagens para ImgBB...";

  try {
    const url1 = await uploadImageToImgBB(image1);
    const url2 = await uploadImageToImgBB(image2);

    status.innerText = "Chamando API do backend...";

    const prediction = await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image1: url1, image2: url2 })
    }).then(res => res.json());

    if (prediction.error) throw new Error(prediction.error);
    const predictionId = prediction.id;

    let resultStatus = prediction.status;
    let videoUrl = "";

    while (resultStatus !== "succeeded" && resultStatus !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const poll = await fetch(`/api/generate-video?id=${predictionId}`).then(res => res.json());
      resultStatus = poll.status;
      if (resultStatus === "succeeded") videoUrl = poll.output;
    }

    if (resultStatus === "succeeded") {
      status.innerText = "Vídeo gerado com sucesso!";
      video.src = videoUrl;
      video.style.display = "block";
      video.load();
    } else {
      throw new Error("Erro ao gerar o vídeo.");
    }
  } catch (err) {
    console.error("Erro:", err);
    status.innerText = "Erro: " + err.message;
  }
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImageToImgBB(file) {
  const formData = new FormData();
  formData.append("image", await toBase64(file));

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  if (!response.ok || !data.success) throw new Error("Erro ao enviar imagem para ImgBB");

  return data.data.url;
}
