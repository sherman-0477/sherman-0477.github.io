// jQuery that will "listen" to the html niceSurvey.html
$(document).ready(function () {
  $('form').on('submit', function () {
    $.ajax({
      type: 'POST',
      url: '/niceSurvey',
      data: $(this).serialize(),
      success: function () {
        alert('Survey submitted successfully.');
        $('form')[0].reset();
      },
      error: function () {
        alert('There was a problem submitting the survey.');
      }
    });

    return false;
  });
});