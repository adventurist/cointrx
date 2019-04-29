import logging


def setup_logger(name, level='INFO', filename='trx.log'):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    log_handler = logging.FileHandler(filename)
    logger_formatter = logging.Formatter('%(asctime)s %(name)s - %(levelname)s - %(message)s')
    log_handler.setFormatter(logger_formatter)

    logger.addHandler(log_handler)
    logger.info('Setup logger for ' + name)

    return logger
