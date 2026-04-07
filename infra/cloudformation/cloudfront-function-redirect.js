function handler(event) {
  var request = event.request;
  var headers = request.headers;

  function buildQueryString(qs) {
    if (!qs) return "";
    var parts = [];
    for (var k in qs) {
      if (!Object.prototype.hasOwnProperty.call(qs, k)) continue;
      var v = qs[k] && qs[k].value !== undefined ? qs[k].value : "";
      if (v === "") {
        parts.push(encodeURIComponent(k));
      } else {
        parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return parts.length ? "?" + parts.join("&") : "";
  }

  // Redirect chat.simonscmap.ai -> simonscmap.ai (preserve path + query)
  var host = headers.host && headers.host.value ? headers.host.value.toLowerCase() : "";
  if (host === "chat.simonscmap.ai") {
    var uri = request.uri || "/";
    var qs = buildQueryString(request.querystring);
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: "https://simonscmap.ai" + uri + qs }
      }
    };
  }

  return request;
}
