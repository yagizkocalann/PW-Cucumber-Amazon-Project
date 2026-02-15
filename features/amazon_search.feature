Feature: Amazon search
  Scenario: Search result contains keyword
    Given Amazon ana sayfasindayim
    When "kulaklığı" icin arama yaparim
    Then arama sonuclarinda ilk urun basligi "kulaklık" veya "kulaklığı" kelimesini icermelidir

  @cart
  Scenario: Search first result and add to cart
    Given Amazon ana sayfasindayim
    When "mouse" icin arama yaparim
    And arama sonucunda "Logitech" iceren 1. urune tiklarim
    And urunu sepete eklerim
    Then sepetime gidip ayni urunun eklendigini gorurum

  @cart
  Scenario: Search second matching brand result and add to cart
    Given Amazon ana sayfasindayim
    When "mouse" icin arama yaparim
    And arama sonucunda "Logitech" iceren 2. urune tiklarim
    And urunu sepete eklerim
    Then sepetime gidip ayni urunun eklendigini gorurum
