function findsite(query) {
    url = 'https://customsearch.googleapis.com/customsearch/v1?cx=e72687dbd68ce4d92&key=AIzaSyAsKxaG3IW9-Ja0kwg1-G8E808FCjDF5Ao&num=1&q=' + query;
    fetch(url)
    .then((response) => response.json())
    .then((data) => {
      location.href = data.items[0].link});
  }