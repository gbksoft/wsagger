function aperi_claude (pict, node_id, noli_claudere) {
   if (node = document.getElementById(node_id)) {
      if (node.style.visibility == "hidden") {
         node.style.visibility = "visible";
         node.style.position   = "static";
         if (pict) pict.src = "/_p/minus.png";

      } else if (!noli_claudere) {
         node.style.visibility = "hidden";
         node.style.position   = "absolute";
         if (pict) pict.src = "/_p/plus.png";
         
      }
      _postere = undefined;
   }
}
