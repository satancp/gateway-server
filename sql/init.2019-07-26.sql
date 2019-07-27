CREATE SCHEMA `gateway` DEFAULT CHARACTER SET utf8mb4 ;

CREATE TABLE `gateway`.`t_user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT NOW(),
  `updated_at` TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC));

CREATE TABLE `gateway`.`t_server` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(500) NOT NULL,
  `bandwidth` VARCHAR(200) NOT NULL,
  `ip` VARCHAR(200) NOT NULL,
  `port` INT(11) NOT NULL,
  `encryption` VARCHAR(100) NOT NULL,
  `password` VARCHAR(200) NOT NULL,
  `location` VARCHAR(200) NOT NULL,
  `country` VARCHAR(200) NOT NULL,
  `level` INT(11) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT NOW(),
  `updated_at` TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC));

CREATE TABLE `gateway`.`t_pac` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `address` VARCHAR(500) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC));
