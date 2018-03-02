<div class="stats">
  Page Loaded <br />
<?php
$interval = file_get_contents("http://blockexplorer.com/q/interval/144");
$winning = file_get_contents("http://blockexplorer.com/api/status?q=getBlockCount");
print $winning/$interval;
?>
<br />Content should have loaded above.
</div>
