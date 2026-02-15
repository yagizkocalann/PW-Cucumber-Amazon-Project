Feature: Amazon search
  Scenario: Search result contains keyword
    Given Amazon ana sayfasindayim
    When "kulaklığı" icin arama yaparim
    Then arama sonuclarinda ilk urun basligi "kulaklık" veya "kulaklığı" kelimesini icermelidir
