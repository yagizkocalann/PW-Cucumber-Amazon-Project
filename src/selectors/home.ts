export const homeSelectors = {
  searchInput: "#twotabsearchtextbox",
  searchButton: "#nav-search-submit-button",
  cookieAccept: [
    "#sp-cc-accept",
    "input#sp-cc-accept",
    "input[name='accept']",
    "button[name='accept']",
    "button:has-text(\"Kabul et\")",
    "a:has-text(\"Kabul et\")"
  ],
  cookieReject: [
    "#sp-cc-rejectall-link",
    "input[name='reject']",
    "button:has-text(\"Reddet\")",
    "a:has-text(\"Reddet\")"
  ]
};
