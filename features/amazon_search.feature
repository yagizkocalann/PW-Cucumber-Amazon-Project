Feature: Amazon search
  Scenario: Search result contains keyword
    Given Amazon ana sayfasindayim
    When "kulaklık" icin arama yaparim
    Then arama sonuclarinda ilk urun basligi "kulaklık" veya "kulaklığı" kelimesini icermelidir

  @cart-positive
  Scenario: Search first result and add to cart
    Given Amazon ana sayfasindayim
    When "mouse" icin arama yaparim
    And arama sonucunda "Logitech" iceren 1. urune tiklarim
    And urunu sepete eklerim
    Then sepetime gidip ayni urunun eklendigini gorurum

  @cart-positive
  Scenario: Search second matching brand result and add to cart
    Given Amazon ana sayfasindayim
    When "mouse" icin arama yaparim
    And arama sonucunda "Logitech" iceren 2. urune tiklarim
    And urunu sepete eklerim
    Then sepetime gidip ayni urunun eklendigini gorurum

  @cart-negative
  Scenario: First mouse should not appear as second mouse in cart
    Given Amazon ana sayfasindayim
    When "mouse" icin arama yaparim
    And arama sonucunda "Logitech" iceren 1. urune tiklarim
    And urunu sepete eklerim
    Then sepetime gidip "G102" iceren urun gorunmemelidir

  @cart-negative
  Scenario: Second mouse should not appear as first mouse in cart
    Given Amazon ana sayfasindayim
    When "mouse" icin arama yaparim
    And arama sonucunda "Logitech" iceren 2. urune tiklarim
    And urunu sepete eklerim
    Then sepetime gidip "Superlight 2" iceren urun gorunmemelidir
