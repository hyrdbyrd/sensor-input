(function(){
    window.addEventListener('DOMContentLoaded', () => {
        const box = document.querySelector('.box');
        const navs = document.querySelector('.box-navs');
        
        new Gesture(
            box.querySelector('.box__image'),
            box,
            navs.querySelector('.navs__bright'),
            navs.querySelector('.navs__zoom'),
            navs.querySelector('.navs__rotate'),
            box.querySelector('.box__fake')
        );
    });
})();