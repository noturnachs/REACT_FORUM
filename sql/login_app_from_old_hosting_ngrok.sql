-- MariaDB dump 10.19  Distrib 10.4.24-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: bzsddmol9xmtxmwpcijv
-- ------------------------------------------------------
-- Server version	10.4.24-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,'test','2023-11-16 11:20:25'),(2,'Welcome to tcc!','2023-11-16 11:25:46'),(3,'Attention all users: All uploaded videos and images have been deleted.','2023-11-16 11:28:51'),(4,'Welcome to TCC!','2023-11-18 18:28:29'),(5,'Gwapo si Nino Jan Roz Cabatas','2023-11-26 23:22:14'),(6,'only valid real usc emails will be unmuted','2023-11-29 20:53:02'),(7,'only validusc emails will be unmuted','2023-11-29 20:53:12'),(8,'only valid usc emails will be unmuted','2023-11-29 20:53:15');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'School of Arts and Sciences'),(2,'School of Engineering'),(3,'School of Architecture, Fine Arts and Design'),(4,'School of Business and Economics'),(5,'School of Education'),(6,'School of Healthcare Professions'),(7,'School of Law and Governance'),(17,'Music'),(18,'Baby'),(19,'Twitter');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `postId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `comment` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (15,49,2,'so cool','2023-11-11 13:56:33'),(16,18,1,'? ','2023-11-11 15:52:14'),(18,68,5,'edge material ','2023-11-11 17:13:04'),(19,79,5,'dfewd','2023-11-12 07:06:01'),(20,79,5,'dwa','2023-11-12 07:06:03'),(21,79,1,'test','2023-11-12 09:52:26'),(22,82,1,'?','2023-11-12 12:46:52'),(24,82,5,'test','2023-11-12 14:22:53'),(25,85,3,'https://thecarolinianconnection.com/post/85','2023-11-12 14:25:11'),(26,85,3,'ahhh mao diay ni ang share link','2023-11-12 14:25:29'),(27,79,1,'cheater','2023-11-12 14:41:28'),(28,88,1,'Fuck you bitch','2023-11-13 23:55:55'),(29,89,1,'hala ka cute sa boang','2023-11-13 23:58:17'),(30,89,3,'\nHii Dane','2023-11-14 03:16:16'),(31,89,13,'Samokaa ','2023-11-14 03:52:14'),(32,92,15,'sorry nin','2023-11-14 15:30:44'),(33,99,1,'gwapoha otin oy','2023-11-18 15:40:32'),(34,102,1,'bastosa nmo dong oy','2023-11-20 14:04:55'),(35,100,12,'haha','2023-11-23 06:02:28'),(36,97,1,'qtiepie','2023-11-23 11:43:37'),(37,106,20,'Edi sana all','2023-11-27 08:22:38'),(38,106,21,'panghatag pls','2023-11-29 13:06:26'),(39,113,1,'HAHAHAHAHAHAH','2023-11-30 04:13:36'),(40,115,1,'merry xmas','2023-12-01 08:51:56');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `postId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=221 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
INSERT INTO `likes` VALUES (180,49,2),(181,18,1),(182,68,7),(183,71,3),(184,63,3),(185,71,1),(186,73,1),(187,74,1),(191,85,3),(192,85,12),(193,89,3),(195,90,13),(196,89,13),(198,90,3),(199,90,15),(200,92,3),(201,87,3),(202,96,1),(204,102,1),(205,101,7),(206,101,5),(207,101,1),(208,106,20),(209,111,3),(210,106,21),(211,111,21),(214,113,7),(216,111,7),(218,114,5),(219,107,21),(220,115,7);
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `category` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (19,3,'Psych','Help','2023-11-09 15:50:07','School of Architecture, Fine Arts and Design',NULL),(21,3,'Soe??','Wat','2023-11-09 15:50:32','School of Education',NULL),(24,3,'Eww','Eww','2023-11-09 15:51:40','Trashtalks',NULL),(26,3,'Hii','Pscych classmate','2023-11-09 15:52:38','School of Architecture, Fine Arts and Design',NULL),(27,3,'Hii','Dormate','2023-11-09 15:52:55','School of Healthcare Professions',NULL),(30,3,'Test','Test','2023-11-09 15:53:50','School of Arts and Sciences',NULL),(31,3,'Test','Test','2023-11-09 15:54:08','School of Arts and Sciences',NULL),(32,3,'Liam','White boy','2023-11-09 15:54:24','Trashtalks',NULL),(33,3,'Kano','Hi','2023-11-09 15:54:46','Trashtalks',NULL),(34,4,'hi','bro','2023-11-09 15:55:29','School of Arts and Sciences',NULL),(35,5,'gwapo','gwapo ako','2023-11-09 15:55:38','School of Arts and Sciences',NULL),(36,5,'pogster','amps dog','2023-11-09 15:55:52','School of Arts and Sciences',NULL),(37,5,'typo previous post','amps *doh','2023-11-09 15:56:13','School of Arts and Sciences',NULL),(38,5,'curry','indian food','2023-11-09 15:56:46','School of Arts and Sciences',NULL),(39,1,'oh no','ougl','2023-11-09 15:56:54','School of Architecture, Fine Arts and Design',NULL),(40,5,'eduardo','cortes','2023-11-09 15:56:57','School of Arts and Sciences',NULL),(41,5,'niño','cabatas','2023-11-09 15:57:07','School of Arts and Sciences',NULL),(42,5,'Dan','Monsales','2023-11-09 15:57:15','School of Arts and Sciences',NULL),(47,6,'Charot','Chuyaaa','2023-11-10 06:22:56','School of Arts and Sciences',NULL),(86,1,'Amen','Amen','2023-11-12 15:15:05','tiktok',NULL),(87,5,'toktik','kk','2023-11-13 09:32:50','tiktok',NULL),(91,1,'No Surprises - Radiohead','https://www.youtube.com/@ditoagustyan02/videos','2023-11-14 10:12:02','Music',NULL),(95,3,'tiktok','tiktok','2023-11-16 13:15:30','School of Arts and Sciences','/uploads/image-1700140529100.mp4'),(96,1,'Hot Wheels','palita ako hotwheels plith','2023-11-16 13:47:57','School of Arts and Sciences','/uploads/image-1700142476088.jpeg'),(97,1,'😍','🥴','2023-11-18 00:33:04','Baby','/uploads/image-1700267583485.jpeg'),(98,12,'ehe','ehe','2023-11-18 02:30:57','Baby',NULL),(100,1,'To Nino','I love you passenger princess 🥴🥰💦','2023-11-20 14:00:37','School of Arts and Sciences','/uploads/image-1700488836421.mp4'),(104,1,'tiktok','1','2023-11-24 16:17:14','Tiktok','/uploads/image-1700842633388.mp4'),(105,1,'DSA','niño jan cabatas will dance this babeh','2023-11-26 13:22:35','Baby','/uploads/image-1701004954697.mp4'),(106,19,'pizza','eat pizza yumyum','2023-11-27 08:17:17','School of Arts and Sciences','/uploads/image-1701073036606.jpg'),(107,1,'DSA','Hagbong DSA','2023-11-28 15:41:57','Baby','/uploads/image-1701186116402.mp4'),(111,1,'DSA BOOK ','BASA LAGI DILI BASA BASA SORRY ','2023-11-29 13:01:13','School of Arts and Sciences','/uploads/image-1701262871226.pdf'),(113,21,'Admin','My main acc','2023-11-29 13:33:15','Baby',NULL),(114,1,'GoodGuy','sogood','2023-11-30 04:13:08','School of Arts and Sciences','/uploads/image-1701317583680.mp4'),(115,7,'HEY','BROS','2023-12-01 07:38:34','School of Arts and Sciences',NULL);
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `href` varchar(255) NOT NULL,
  `price` varchar(255) NOT NULL,
  `imageSrc` varchar(255) NOT NULL,
  `imageAlt` text NOT NULL,
  `category` varchar(255) NOT NULL,
  `size` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Earthen Bottle','#','$48','https://tailwindui.com/img/ecommerce-images/category-page-04-image-card-01.jpg','Tall slender porcelain bottle with natural clay textured body and cork stopper.','sas','2l','totes'),(2,'Nomad Tumbler','#','$35','https://tailwindui.com/img/ecommerce-images/category-page-04-image-card-02.jpg','Olive drab green insulated bottle with flared screw lid and flat top.','safad','N/A','tees'),(3,'Focus Paper Refill','#','$89','https://tailwindui.com/img/ecommerce-images/category-page-04-image-card-03.jpg','Person using a pen to cross a task off a productivity paper card.','soe','N/A','slings'),(4,'Machined Mechanical Pencil','#','$35','https://tailwindui.com/img/ecommerce-images/category-page-04-image-card-04.jpg','Hand holding black machined steel mechanical pencil with brass tip and top.','sed','N/A','sweaters');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `status` varchar(255) DEFAULT 'none',
  `profile_photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'dan','22102950@usc.edu.ph','$2b$10$PsinB3JaeRJSnBASxC0uTOkVMWZw4f4MeACcrVdbH.rgXSqGHX1RK','admin','none','/uploads/profile_photo-1700739243801.jpg'),(3,'injan2','1234@usc.edu.ph','$2b$10$oAFck66dDyS1BPnsCBs9pezQ.QLrfIjchEfEjm2l3hVqJHbxTlvja','admin','none','/uploads/profile_photo-1700303960193.jpg'),(4,'ed','edo@usc.edu.ph','$2b$10$TyasTyWrnFINpDYrLYcfuebRFApvNT.LwaKuCzaj3z.etq1M6uiGW','user','none',NULL),(5,'pogi','22101039@usc.edu.ph','$2b$10$zB5NbzHeXEIqnZ2nsMLNP.y31faOvfSttbF7PGwwWYc9rWGRkv2eG','admin','none','/uploads/profile_photo-1700250961377.jpg'),(6,'Cel','20102859@usc.edu.ph','$2b$10$WZGxtU4oTjw4bcEGqy4P3uSJB7M2.jEwpY8zABSl1P2CkSZ3ErSX2','user','muted',NULL),(7,'edel','20101102@usc.edu.ph','$2b$10$C/2YPIK405hhXHYZVbX3xu0wAaWGYEgz1tvKSyvz5m9szX1Evc1di','admin','none','/uploads/profile_photo-1700317780205.jpeg'),(8,'giniecakes','giniecakes@usc.edu.ph','$2b$10$3LXWYtFCFHh/ibkC6G94f.bNOHAIjHRmpPyEYksLyp/gGSCuTFMOW','user','muted',NULL),(9,'haroldbulok','22102949@usc.edu.ph','$2b$10$XApS.xfxRlw2h8FQjTHbsuWHaZfQkNsbyhDxoDrT7J/WpiDCOfeui','user','none',NULL),(10,'anndrew','22103328@usc.edu.ph','$2b$10$IttcjIWR.keBOt/xyYD1serclEJGqQyHYNqs.BhO1R/rVV773Zyk6','user','muted',NULL),(11,'Bruh','bruh@usc.edu.ph','$2b$10$0Q4YFg.4JTSXaRis.5gCYebO92F73doLBGIqIXmXm5LLJxaUkbPgm','user','muted',NULL),(12,'dan2','dan2@usc.edu.ph','$2b$10$Kj46Hv4b31fgjkGckf15/.yYt2GJrjgRMUYryhCw5ATa2mtOk/SDm','user','none','/uploads/profile_photo-1700274632876.png'),(13,'Dannie','22101555@usc.edu.ph','$2b$10$Tv.M07KmOo/oyQvWwsx6eOQVPNHLUCqY3LmG7i7MWaQFiDFy73N0a','user','none',NULL),(14,'injan3','injan@usc.edu.ph','$2b$10$JMF4CRTLMaxsTFb3ialYIOmE8KQUmC7s1Mj5oakUPQ9wmOwPIEIBq','user','muted',NULL),(15,'marg','margadoc@usc.edu.ph','$2b$10$BYBXdgQvQpZ17TJWguk.teC.9cKImTEbc5KGD9mY4vuItrEdUBWba','user','muted',NULL),(16,'jayardoza','22103017@usc.edu.ph','$2b$10$uVrsgr31xVJQ8qDHdCk/9.E73khzx8JJB.7QzQ.F5flDYuSSREI.6','user','muted','/uploads/profile_photo-1701263306247.jfif'),(17,'Cell','21100411@usc.edu.ph','$2b$10$5KzuKQHVbZMLikv/HeVLfe0atLvag5XWj.68Q8YD.ZSYHjrLROZZq','user','none',NULL),(18,'Bro','bro@usc.edu.ph','$2b$10$GYdsmrJtu.UkUn.jlJNbD.GOhdxc86ZXE3G7WJQVAUyaEKj2eOQuC','user','muted',NULL),(19,'marga','marga@usc.edu.ph','$2b$10$MRSkqWV2BFkQJIeTfuL.yexxENKvBkmGvtv7r9zCxaj480/f/OzNm','user','muted','/uploads/profile_photo-1701153118144.png'),(20,'celebrate','whatda@usc.edu.ph','$2b$10$HpFUOPZZFVVO4rXyKDkygOxfbfIUngHIwyJWVDdczq5e4qseG/vui','user','muted',NULL),(21,'injanisback','22104380@usc.edu.ph','$2b$10$cY9Nm.IkMS4u701yLUZCnu3dL9s8bvGR0rGXInkPUP8KGQ0814pmS','user','none',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;


-- Table structure for table `orders`
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `course` varchar(255) NOT NULL,
  `year` varchar(255) NOT NULL,
  `total` decimal(10, 2) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- Table structure for table `order_items`
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`),
  FOREIGN KEY (`productId`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;



ALTER TABLE `orders`
ADD COLUMN `status` ENUM('confirming', 'preparing', 'ready') NOT NULL DEFAULT 'confirming' AFTER `timestamp`;




/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-12-05 16:08:10
