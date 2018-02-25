<html>
  <head>
    <link rel="stylesheet" href="styles.css">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>CoinTRX MultiCoin Mining Pool</title>
  </head>

<body>

<?php
ob_start();
require_once('header.php');  /* gets the header and loads it on the page */
$file_content = ob_get_contents();
ob_get_clean();
ECHO($file_content );
?>

        <div class="content">

          <?php
	$page = $_GET['page'];	/* gets the variable $page */
	if (!empty($page)) {
    ob_start();
    $page .= '.php';
		include($page);
    $file_content = ob_get_contents();
    ob_get_clean();
    ECHO($file_content );
	} 	/* if $page has a value, include it */
	else {
    ob_start();
		include('main.php');
    $file_content = ob_get_contents();
    ob_get_clean();
    ECHO($file_content );
	} 	/* otherwise, include the default page */
?>
        </div>


      <?php
      ob_start();
      include('footer.php');
      $file_content = ob_get_contents();
      ob_get_clean();
      ECHO($file_content );
      ?>

</body>
</html>
