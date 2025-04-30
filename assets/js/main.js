// (function ($) {
//     "use strict";

//     // Spinner
//     var spinner = function () {
//         setTimeout(function () {
//             if ($('#spinner').length > 0) {
//                 $('#spinner').removeClass('show');
//             }
//         }, 1);
//     };
//     spinner();
    
    
//     // Back to top button
//     $(window).scroll(function () {
//         if ($(this).scrollTop() > 300) {
//             $('.back-to-top').fadeIn('slow');
//         } else {
//             $('.back-to-top').fadeOut('slow');
//         }
//     });
//     $('.back-to-top').click(function () {
//         $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
//         return false;
//     });


//     // Sidebar Toggler
//     $('.sidebar-toggler').click(function () {
//         $('.sidebar, .content').toggleClass("open");
//         return false;
//     });


//     // Progress Bar
//     $('.pg-bar').waypoint(function () {
//         $('.progress .progress-bar').each(function () {
//             $(this).css("width", $(this).attr("aria-valuenow") + '%');
//         });
//     }, {offset: '80%'});

   
// })(jQuery);

var navs = document.getElementsByClassName('navs');

for (let i = 0; i < navs.length; i++) {
    navs[i].addEventListener('click', (e) => {
        let pageName = e.target.textContent.toLowerCase();

        window.pageRedirect.redirect(`./pages/${pageName}.html`);
    });   
}

var signOutBtn = document.querySelector('.sign-out-nav');

signOutBtn.addEventListener('click', async () => {
    // Trigger the logout operation
    const logout = await window.electronStore.logout();

    const redirect = await window.pageRedirect.redirect(`./pages/signin.html`);
});