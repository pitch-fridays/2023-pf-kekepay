//=============sticky navbar=================
window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0)
})
//===============language dropdown menu=============
const language = document.getElementById('language');
const text = document.getElementById('text');
const option = document.getElementsByClassName('option');

language.addEventListener('click', function() {
    language.classList.toggle('active');
})

for(options of option) {
    options.onclick = function() {
        text.innerHTML = this.textContent;
    }
}
//==============FAQS================
const faqs = document.getElementsByClassName('questions-answers');

for (i = 0; i<faqs.length; i++){
    faqs[i].addEventListener('click', function() {
        this.classList.toggle('active')
    })
}